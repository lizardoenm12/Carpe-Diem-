package com.example.carpediem.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.carpediem.ui.theme.EmotionColorManager
import com.example.carpediem.ui.theme.emotionHexColor
import com.google.firebase.Timestamp
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale

data class DashboardUiState(
    val isLoading: Boolean = true,
    val userName: String = "",
    val nivelEmocion: Int = 5,
    val mensajeCapitan: String = "",
    val totalMaterias: Int = 0,
    val ultimaMateria: String? = null,
    val eventos: List<DashboardEvent> = emptyList(),
    val actividadesHoy: List<DashboardActivity> = emptyList(),
    val emotionColor: String = "#F5F5DC"
)

data class DashboardEvent(
    val id: String = "",
    val titulo: String = "",
    val fechaTexto: String = "",
    val fechaMillis: Long = 0L,
    val tipo: String = "tarea"
)

data class DashboardActivity(
    val id: String = "",
    val nombre: String = "",
    val tipo: String = "",
    val horaInicio: String = "",
    val horaFin: String = ""
)

class DashboardViewModel : ViewModel() {

    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState

    init {
        loadDashboard()
    }

    fun loadDashboard() {
        viewModelScope.launch {
            try {
                val user = auth.currentUser ?: return@launch

                val firstName = user.displayName
                    ?.split(" ")
                    ?.firstOrNull()
                    ?: "Capitán"

                // CHECK-IN
                val checkInSnap = db.collection("checkins")
                    .whereEqualTo("uid", user.uid)
                    .get()
                    .await()

                val checkInDoc = checkInSnap.documents.maxByOrNull { doc ->
                    readMillis(doc.get("createdAt"))
                }
                val nivel = checkInDoc?.getLong("nivel")?.toInt() ?: 5

               // EmotionColorManager.setNivel(nivel)

                //val emotionColor = emotionHexColor(nivel)
                val emotionColor = "#E1F5EE"
                val mensaje = buildMensajeCapitan(firstName, nivel)

                // MATERIAS
                val materiasSnap = db.collection("subjects")
                    .whereEqualTo("uid", user.uid)
                    .get()
                    .await()

                val materias = materiasSnap.documents

                val ultimaMateria = materias
                    .maxByOrNull { doc ->
                        readMillis(doc.get("createdAt"))
                    }
                    ?.getString("name")

                // EVENTOS
                val eventosSnap = db.collection("eventos")
                    .whereEqualTo("uid", user.uid)
                    .get()
                    .await()

                val eventos = eventosSnap.documents
                    .map { doc ->
                        val fechaMillis = readFechaMillis(
                            doc.get("fecha") ?: doc.get("date")
                        )

                        DashboardEvent(
                            id = doc.id,
                            titulo = doc.getString("titulo")
                                ?: doc.getString("title")
                                ?: "Sin título",
                            fechaTexto = formatDate(fechaMillis),
                            fechaMillis = fechaMillis,
                            tipo = doc.getString("tipo") ?: "tarea"
                        )
                    }
                    .filter { it.fechaMillis != 0L }
                    .sortedBy { it.fechaMillis }
                    .take(6)

                // ACTIVIDADES DE HOY
                val actividadesHoy = eventos
                    .filter { isToday(it.fechaMillis) }
                    .map { evento ->
                        DashboardActivity(
                            id = evento.id,
                            nombre = evento.titulo,
                            tipo = evento.tipo,
                            horaInicio = "Hoy",
                            horaFin = evento.fechaTexto
                        )
                    }

                _uiState.value = DashboardUiState(
                    isLoading = false,
                    userName = firstName,
                    nivelEmocion = nivel,
                    mensajeCapitan = mensaje,
                    totalMaterias = materias.size,
                    ultimaMateria = ultimaMateria,
                    eventos = eventos,
                    actividadesHoy = actividadesHoy,
                    emotionColor = emotionColor
                )

            } catch (e: Exception) {
                _uiState.value = DashboardUiState(
                    isLoading = false,
                    mensajeCapitan = e.message ?: "Error desconocido",
                    emotionColor = "#F5F5DC"
                )
            }
        }
    }

    private fun buildMensajeCapitan(nombre: String, nivel: Int): String {
        return when {
            nivel <= 2 ->
                "Hoy parece un día pesado, $nombre. Vamos paso a paso, sin presión."

            nivel <= 4 ->
                "Respira, $nombre. Podemos ordenar una tarea pequeña y avanzar."

            else ->
                "¡Oh Capitán, mi Capitán! Hoy tienes buena energía para avanzar, $nombre."
        }
    }

    private fun readFechaMillis(value: Any?): Long {
        return when (value) {
            is Timestamp -> value.toDate().time
            is Date -> value.time
            is Long -> value
            is Double -> value.toLong()
            is String -> {
                try {
                    val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
                    formatter.parse(value)?.time ?: 0L
                } catch (e: Exception) {
                    0L
                }
            }
            else -> 0L
        }
    }

    private fun readMillis(value: Any?): Long {
        return when (value) {
            is Timestamp -> value.toDate().time
            is Date -> value.time
            is Long -> value
            is Double -> value.toLong()
            else -> 0L
        }
    }

    private fun formatDate(fechaMillis: Long): String {
        if (fechaMillis == 0L) return "Sin fecha"

        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            .format(Date())

        val eventDay = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault())
            .format(Date(fechaMillis))

        return if (today == eventDay) {
            "Hoy"
        } else {
            SimpleDateFormat("dd MMM yyyy", Locale("es", "GT"))
                .format(Date(fechaMillis))
        }
    }

    private fun startOfTodayMillis(): Long {
        return Calendar.getInstance().apply {
            set(Calendar.HOUR_OF_DAY, 0)
            set(Calendar.MINUTE, 0)
            set(Calendar.SECOND, 0)
            set(Calendar.MILLISECOND, 0)
        }.timeInMillis
    }

    private fun isToday(time: Long): Boolean {
        val today = Calendar.getInstance()
        val other = Calendar.getInstance().apply {
            timeInMillis = time
        }

        return today.get(Calendar.YEAR) == other.get(Calendar.YEAR) &&
                today.get(Calendar.DAY_OF_YEAR) == other.get(Calendar.DAY_OF_YEAR)
    }
}