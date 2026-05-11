package com.example.carpediem.presentation.onboarding

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await

class OnboardingViewModel : ViewModel() {

    private val auth      = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()

    // ── Estado de navegación ──────────────────────────────────────────────────
    private val _finished = MutableStateFlow(false)
    val finished: StateFlow<Boolean> = _finished

    // ── Loading y error ───────────────────────────────────────────────────────
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    // ── Guardar perfil en Firestore ───────────────────────────────────────────
    fun guardarPerfil(perfil: String, metodo: String) {
        val uid = auth.currentUser?.uid
        if (uid == null) {
            _errorMessage.value = "No hay sesión activa."
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                firestore.collection("users").document(uid).set(
                    mapOf(
                        "perfil"             to perfil,
                        "metodo"             to metodo,
                        "onboardingComplete" to true,
                        "creadoEn"           to System.currentTimeMillis()
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