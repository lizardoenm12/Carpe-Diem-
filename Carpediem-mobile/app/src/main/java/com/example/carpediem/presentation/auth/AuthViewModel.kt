package com.example.carpediem.presentation.auth


import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseAuthInvalidCredentialsException
import com.google.firebase.auth.FirebaseAuthUserCollisionException
import com.google.firebase.auth.FirebaseAuthWeakPasswordException
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await
import com.google.firebase.auth.GoogleAuthProvider

class AuthViewModel : ViewModel() {

    private val auth      = FirebaseAuth.getInstance()
    private val firestore = FirebaseFirestore.getInstance()

    // ── Navegación ────────────────────────────────────────────────────────────
    private val _destination = MutableStateFlow<AuthDestination?>(null)
    val destination: StateFlow<AuthDestination?> = _destination

    // ── Error visible en la UI ────────────────────────────────────────────────
    private val _errorMessage = MutableStateFlow<String?>(null)
    val errorMessage: StateFlow<String?> = _errorMessage

    // ── Loading ───────────────────────────────────────────────────────────────
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    // ─────────────────────────────────────────────────────────────────────────
    fun login(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _errorMessage.value = "Escribe correo y contraseña"
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                val result = auth.signInWithEmailAndPassword(email.trim(), password).await()
                val uid    = result.user?.uid ?: return@launch

                val onboardingComplete = firestore.collection("users")
                    .document(uid)
                    .get()
                    .await()
                    .getBoolean("onboardingComplete") ?: false

                _destination.value =
                    if (onboardingComplete) AuthDestination.CheckIn
                    else AuthDestination.Onboarding

            } catch (e: FirebaseAuthInvalidCredentialsException) {
                _errorMessage.value = "Correo o contraseña incorrectos."
            } catch (e: Exception) {
                _errorMessage.value = "Ocurrió un error. Intenta de nuevo."
            } finally {
                _isLoading.value = false
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    fun register(email: String, password: String) {
        if (email.isBlank() || password.isBlank()) {
            _errorMessage.value = "Escribe correo y contraseña"
            return
        }

        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null
            try {
                val result = auth.createUserWithEmailAndPassword(email.trim(), password).await()
                val uid    = result.user?.uid ?: return@launch

                firestore.collection("users").document(uid).set(
                    mapOf(
                        "email"              to email.trim(),
                        "onboardingComplete" to false,
                        "createdAt"          to System.currentTimeMillis()
                    )
                ).await()

                _destination.value = AuthDestination.Onboarding

            } catch (e: FirebaseAuthWeakPasswordException) {
                _errorMessage.value = "La contraseña debe tener al menos 6 caracteres."
            } catch (e: FirebaseAuthUserCollisionException) {
                _errorMessage.value = "Este correo ya está registrado. Inicia sesión."
            } catch (e: Exception) {
                _errorMessage.value = "Ocurrió un error. Intenta de nuevo."
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun loginWithGoogle(idToken: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _errorMessage.value = null

            try {
                val credential = GoogleAuthProvider.getCredential(idToken, null)
                val result = auth.signInWithCredential(credential).await()
                val user = result.user ?: return@launch

                val userRef = firestore.collection("users").document(user.uid)
                val userDoc = userRef.get().await()

                if (!userDoc.exists()) {
                    userRef.set(
                        mapOf(
                            "email" to (user.email ?: ""),
                            "name" to (user.displayName ?: ""),
                            "photoUrl" to (user.photoUrl?.toString() ?: ""),
                            "onboardingComplete" to false,
                            "createdAt" to System.currentTimeMillis()
                        )
                    ).await()
                }

                val onboardingComplete = userRef
                    .get()
                    .await()
                    .getBoolean("onboardingComplete") ?: false

                _destination.value =
                    if (onboardingComplete) AuthDestination.CheckIn
                    else AuthDestination.Onboarding

            } catch (e: Exception) {
                _errorMessage.value = "No se pudo iniciar sesión con Google."
            } finally {
                _isLoading.value = false
            }
        }
    }
    // Limpia el error una vez que la UI lo consumió
    fun clearError() {
        _errorMessage.value = null
    }
}