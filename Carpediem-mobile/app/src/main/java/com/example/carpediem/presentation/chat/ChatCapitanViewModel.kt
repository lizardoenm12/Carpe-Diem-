package com.example.carpediem.presentation.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import com.google.firebase.Firebase
import com.google.firebase.ai.ai
import com.google.firebase.ai.type.GenerativeBackend

class ChatCapitanViewModel : ViewModel() {

    private val _uiState = MutableStateFlow(
        ChatUiState(
            messages = listOf(
                ChatMessage(
                    text = "¡Oh Capitán, mi Capitán! ¿Qué necesitas hoy?",
                    isUser = false
                )
            )
        )
    )

    val uiState: StateFlow<ChatUiState> = _uiState

    fun updateInput(text: String) {
        _uiState.value = _uiState.value.copy(
            currentInput = text
        )
    }

    fun sendMessage() {

        val message = _uiState.value.currentInput.trim()

        if (message.isBlank()) return

        val updatedMessages = _uiState.value.messages + ChatMessage(
            text = message,
            isUser = true
        )

        _uiState.value = _uiState.value.copy(
            messages = updatedMessages,
            currentInput = "",
            isLoading = true
        )

        viewModelScope.launch {

            delay(1000)

            val response = askGemini(message)

            _uiState.value = _uiState.value.copy(
                messages = _uiState.value.messages + ChatMessage(
                    text = response,
                    isUser = false
                ),
                isLoading = false
            )
        }
    }

    private fun generateFakeResponse(
        input: String
    ): String {

        val lower = input.lowercase()

        return when {

            "estres" in lower ->
                "Parece que estás cargando demasiado hoy. Probemos dividir el trabajo en partes pequeñas."

            "triste" in lower ->
                "No necesitas resolver todo hoy. Solo avanzar un poco ya cuenta."

            "ansiedad" in lower ->
                "Intentemos enfocarnos en una sola tarea a la vez."

            "examen" in lower ->
                "Podemos organizar un mini plan de estudio para ese examen."

            else ->
                "Entiendo. Cuéntame un poco más para ayudarte mejor."
        }
    }
    private suspend fun askGemini(userMessage: String): String {
        return try {
            val model = Firebase.ai(
                backend = GenerativeBackend.googleAI()
            ).generativeModel("gemini-3-flash-preview")

            val prompt = """
            Eres El Capitán, un tutor IA calmado para una app llamada Carpe Diem.
            Ayudas a estudiantes a organizarse, estudiar y manejar estrés.
            Responde breve, humano y práctico.
            No des discursos largos.
            
            Usuario: $userMessage
        """.trimIndent()

            val response = model.generateContent(prompt)

            response.text ?: "No pude generar respuesta. Intenta de nuevo."
        } catch (e: Exception) {
            "Tuve un problema conectando con El Capitán. Revisa Firebase AI Logic o tu conexión."
        }
    }
}