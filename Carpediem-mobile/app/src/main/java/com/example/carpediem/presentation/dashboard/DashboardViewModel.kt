package com.example.carpediem.presentation.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
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
    val actividadesHoy: List<DashboardActivity> = emptyList()
)

data class DashboardEvent(
    val id: String = "",
    val titulo: String = "",
    val fechaTexto: String = ""
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

                val userDoc = db.collection("users")
                    .document(user.uid)
                    .get()
                    .await()

                val nivel = userDoc.getLong("nivelActual")?.toInt() ?: 5
                val metodo = userDoc.getString("metodo") ?: "Pomodoro"

                val mensaje = buildMensajeCapitan(firstName, nivel, metodo)

                val materiasSnap = db.collection("subjects")
                    .whereEqualTo("uid", user.uid)
                    .get()
                    .await()

                val materias = materiasSnap.documents
                val ultimaMateria = materias
                    .maxByOrNull { it.getTimestamp("createdAt")?.seconds ?: 0 }
                    ?.getString("name")

                val eventosSnap = db.collection("eventos")
                    .whereEqualTo("uid", user.uid)
                    .limit(20)
                    .get()
                    .await()

                val eventos = eventosSnap.documents
                    .filter { it.getBoolean("completado") != true }
                    .map {
                        DashboardEvent(
                            id = it.id,
                            titulo = it.getString("titulo") ?: "Sin título",
                            fechaTexto = formatDate(it.getDate("fecha"))
                        )
                    }
                    .take(4)

                val diaActual = SimpleDateFormat("EEEE", Locale("es", "GT"))
                    .format(Date())
                    .replaceFirstChar { it.uppercase() }

                val horarioDoc = db.collection("horarios")
                    .document(user.uid)
                    .get()
                    .await()

                val actividadesHoy = mutableListOf<DashboardActivity>()

                val lista = horarioDoc.get(diaActual) as? List<Map<String, Any>>
                lista?.forEach { item ->
                    actividadesHoy.add(
                        DashboardActivity(
                            id = item["id"]?.toString() ?: "",
                            nombre = item["nombre"]?.toString() ?: "",
                            tipo = item["tipo"]?.toString() ?: "estudio",
                            horaInicio = item["horaInicio"]?.toString() ?: "",
                            horaFin = item["horaFin"]?.toString() ?: ""
                        )
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
                    actividadesHoy = actividadesHoy.sortedBy { it.horaInicio }
                )

            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    mensajeCapitan = "No pude cargar todo el dashboard. Revisa Firestore o las rutas."
                )
            }
        }
    }

    private fun buildMensajeCapitan(nombre: String, nivel: Int, metodo: String): String {
        return when {
            nivel < 3 && metodo == "Pomodoro" ->
                "Veo que hoy el ánimo está bajo, $nombre. Probemos estudiar sin presión y con pausas suaves."

            nivel >= 5 ->
                "¡Oh Capitán, mi Capitán! Tienes buena energía hoy, $nombre. Es buen momento para avanzar."

            else ->
                "Hola $nombre. Un paso a la vez es suficiente por hoy."
        }
    }

    private fun formatDate(date: Date?): String {
        if (date == null) return "Pronto"

        val today = SimpleDateFormat("yyyyMMdd", Locale.getDefault()).format(Date())
        val eventDay = SimpleDateFormat("yyyyMMdd", Locale.getDefault()).format(date)

        return if (today == eventDay) {
            "Hoy"
        } else {
            SimpleDateFormat("dd MMM", Locale("es", "GT")).format(date)
        }
    }
}