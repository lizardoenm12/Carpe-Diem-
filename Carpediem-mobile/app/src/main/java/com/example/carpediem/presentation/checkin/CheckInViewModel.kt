package com.example.carpediem.presentation.checkin


import androidx.compose.ui.graphics.Color
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import java.text.SimpleDateFormat
import java.util.*

// ── Modelo ────────────────────────────────────────────────────────────────────
data class Emocion(
    val label: String,
    val emoji: String,
    val color: Color,
    val fondo: Color,
    val nivel: Int
)

val emociones = listOf(
    Emocion("Genial",    "✨", Color(0xFF52C788), Color(0xFFEDFBF3), 6),
    Emocion("Tranquilo", "🌿", Color(0xFF7DBF9E), Color(0xFFF0FAF4), 5),
    Emocion("Nervioso",  "🌤️", Color(0xFFE8C84A), Color(0xFFFDFBEA), 4),
    Emocion("Agobiado",  "🍂", Color(0xFFE8A157), Color(0xFFFEF6ED), 3),
    Emocion("Frustrado", "🌧️", Color(0xFFE87A6A), Color(0xFFFEF0EE), 2),
    Emocion("Burnout",   "🌑", Color(0xFFC45C5C), Color(0xFFFAF0F0), 1),
)

// ── ViewModel ─────────────────────────────────────────────────────────────────
class CheckInViewModel : ViewModel() {

    private val auth      = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()

    private val _finished = MutableStateFlow(false)
    val finished: StateFlow<Boolean> = _finished

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    fun guardar(emocion: Emocion) {
        val uid = auth.currentUser?.uid ?: return
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                val fecha = SimpleDateFormat("EEE MMM dd yyyy", Locale.getDefault()).format(Date())
                firestore.collection("checkins")
                    .document("${uid}_${fecha}")
                    .set(
                        mapOf(
                            "uid"    to uid,
                            "emocion" to emocion.label,
                            "nivel"  to emocion.nivel,
                            "fecha"  to System.currentTimeMillis()
                        )
                    ).await()
                _finished.value = true
            } catch (e: Exception) {
                _errorMessage.value = "Error al guardar. Intenta de nuevo."
            } finally {
                _isLoading.value = false
            }
        }
    }
}