package com.example.carpediem.presentation.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.GenerativeBackend
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

data class SubjectOption(
    val id: String,
    val name: String
)

class ChatCapitanViewModel : ViewModel() {

    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()

    private val _uiState = MutableStateFlow(
        ChatUiState(
            messages = listOf(
                ChatMessage(
                    text = "Soy el Capitán, tu tutor de estudio en Carpe Diem. Siempre puedes llamarme con un buen ¡Oh Capitán, mi Capitán!",
                    isUser = false
                )
            )
        )
    )

    val uiState: StateFlow<ChatUiState> = _uiState

    private val _subjects = MutableStateFlow<List<SubjectOption>>(emptyList())
    val subjects: StateFlow<List<SubjectOption>> = _subjects

    private val _emotionLevel = MutableStateFlow(5)
    val emotionLevel: StateFlow<Int> = _emotionLevel

    private val _savingChat = MutableStateFlow(false)
    val savingChat: StateFlow<Boolean> = _savingChat

    init {
        loadLatestCheckIn()
    }

    fun updateInput(text: String) {
        _uiState.value = _uiState.value.copy(
            currentInput = text
        )
    }

    fun sendMessage() {

        val input = _uiState.value.currentInput.trim()

        if (input.isBlank() || _uiState.value.isLoading) return

        _uiState.value = _uiState.value.copy(
            messages = _uiState.value.messages + ChatMessage(
                text = input,
                isUser = true
            ),
            currentInput = "",
            isLoading = true
        )

        viewModelScope.launch {

            val response = try {

                val gemini = askGemini(input)

                if (gemini.isBlank()) {
                    generateLocalResponse(input)
                } else {
                    gemini
                }

            } catch (e: Exception) {
            e.printStackTrace()
            "No pude conectarme con Gemini. Error: ${e.message}"
        }

            _uiState.value = _uiState.value.copy(
                messages = _uiState.value.messages + ChatMessage(
                    text = response,
                    isUser = false
                ),
                isLoading = false
            )
        }
    }

    fun loadSubjects() {

        val user = auth.currentUser ?: return

        viewModelScope.launch {

            val snapshot = db.collection("subjects")
                .whereEqualTo("uid", user.uid)
                .get()
                .await()

            _subjects.value = snapshot.documents.mapNotNull { doc ->

                val name = doc.getString("name")
                    ?: return@mapNotNull null

                SubjectOption(
                    id = doc.id,
                    name = name
                )
            }
        }
    }

    fun saveChatToSubject(
        subjectId: String,
        subjectName: String,
        onDone: () -> Unit
    ) {

        val user = auth.currentUser ?: return
        val messages = _uiState.value.messages

        if (messages.isEmpty()) return

        viewModelScope.launch {

            try {

                _savingChat.value = true

                val firstUserMessage = messages
                    .firstOrNull { it.isUser }
                    ?.text
                    ?: "Chat guardado en $subjectName"

                val title =
                    if (firstUserMessage.length > 50) {
                        firstUserMessage.take(50) + "..."
                    } else {
                        firstUserMessage
                    }

                val chatDoc = db.collection("subject_chats")
                    .document()

                chatDoc.set(
                    mapOf(
                        "uid" to user.uid,
                        "subjectId" to subjectId,
                        "title" to title,
                        "createdAt" to System.currentTimeMillis(),
                        "updatedAt" to System.currentTimeMillis()
                    )
                ).await()

                messages.forEach { message ->

                    db.collection("subject_chat_messages")
                        .document()
                        .set(
                            mapOf(
                                "chatId" to chatDoc.id,
                                "uid" to user.uid,
                                "subjectId" to subjectId,
                                "role" to if (message.isUser) {
                                    "user"
                                } else {
                                    "captain"
                                },
                                "text" to message.text,
                                "createdAt" to System.currentTimeMillis()
                            )
                        )
                        .await()
                }

                onDone()

            } catch (_: Exception) {

            } finally {

                _savingChat.value = false

            }
        }
    }

    private fun loadLatestCheckIn() {

        val user = auth.currentUser ?: return

        viewModelScope.launch {

            try {

                val snapshot = db.collection("checkins")
                    .whereEqualTo("uid", user.uid)
                    .orderBy(
                        "createdAt",
                        com.google.firebase.firestore.Query.Direction.DESCENDING
                    )
                    .limit(1)
                    .get()
                    .await()

                val nivel = snapshot.documents.firstOrNull()
                    ?.getLong("nivel")
                    ?.toInt()
                    ?: 5

                _emotionLevel.value = nivel

                val message = when {

                    nivel <= 2 ->
                        "Hoy parece un día pesado. Estoy aquí para ayudarte con calma, sin presión."

                    nivel <= 4 ->
                        "Hoy podemos avanzar poco a poco. Dime qué necesitas ordenar primero."

                    else ->
                        "¡Oh Capitán, mi Capitán! Hoy tienes buena energía para avanzar."
                }

                _uiState.value = _uiState.value.copy(
                    messages = listOf(
                        ChatMessage(
                            text = message,
                            isUser = false
                        )
                    )
                )

            } catch (_: Exception) {

            }
        }
    }

    private suspend fun askGemini(
        userMessage: String
    ): String {

        val model = Firebase.ai(
            backend = GenerativeBackend.googleAI()
        ).generativeModel(
            modelName = "gemini-3.1-flash-lite"
        )

        val emotionalContext = getEmotionalContext()

        val history = _uiState.value.messages
            .takeLast(8)
            .joinToString("\n") {

                if (it.isUser) {
                    "Usuario: ${it.text}"
                } else {
                    "Capitán: ${it.text}"
                }
            }

        val prompt = """
            Eres El Capitán, tutor de estudio de Carpe Diem.
            Estás inspirado en el profesor Keating de Dead Poets Society.

            Contexto emocional:
            $emotionalContext

            Historial reciente:
            $history

            Mensaje actual del usuario:
            $userMessage

            Responde en español.
            No repitas siempre la misma frase.
            Responde directamente a lo que el usuario preguntó.
            Sé breve, humano, calmado y práctico.
        """.trimIndent()

        val response = model.generateContent(prompt)

        return response.text ?: ""
    }

    private fun getEmotionalContext(): String {

        return when (_emotionLevel.value) {

            in 1..2 ->
                "El usuario está emocionalmente agotado. Responde con calma, suavidad y pasos pequeños."

            in 3..4 ->
                "El usuario está algo cansado. Responde breve, ordenado y sin presión."

            in 5..7 ->
                "El usuario está estable emocionalmente. Puedes responder con claridad y motivación moderada."

            else ->
                "El usuario tiene buena energía. Puedes motivarlo y proponer acciones concretas."
        }
    }

    private fun generateLocalResponse(
        input: String
    ): String {

        val lower = input.lowercase()

        return when {

            "estres" in lower || "estrés" in lower ->
                "Parece que estás cargando mucho. Tomemos una sola tarea y la dividimos en pasos pequeños."

            "examen" in lower ->
                "Para ese examen podemos hacer tres pasos: repasar conceptos clave, practicar preguntas y descansar bien antes."

            "tarea" in lower ->
                "Primero definamos qué debes entregar. Luego buscamos el primer paso más pequeño."

            "no entiendo" in lower ->
                "Está bien no entender al inicio. Dime el tema y lo explicamos por partes."

            else ->
                "Te escucho. Cuéntame un poco más y lo ordenamos juntos, sin presión."
        }
    }
}