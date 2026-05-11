package com.example.carpediem.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import kotlinx.coroutines.tasks.await


data class ProfileUiState(
    val isLoading: Boolean = true,
    val saving: Boolean = false,
    val displayName: String = "",
    val email: String = "",
    val studyStyle: String = "mixto",
    val preferredIntensity: String = "suave",
    val currentGoal: String = "organizacion",
    val tonoCapitan: String = "poetico",
    val notaCapitan: String = "",
    val frasePersonal: String = "",
    val totalStudyActions: Long = 0,
    val error: String? = null
)

class ProfileViewModel : ViewModel() {

    private val auth = FirebaseAuth.getInstance()
    private val db = FirebaseFirestore.getInstance()

    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState

    init {
        loadProfile()
    }

    fun loadProfile() {
        viewModelScope.launch {
            try {
                val user = auth.currentUser ?: return@launch

                val ref = db.collection("userProfiles").document(user.uid)
                val snap = ref.get().await()

                if (!snap.exists()) {
                    ref.set(
                        mapOf(
                            "uid" to user.uid,
                            "displayName" to (user.displayName ?: ""),
                            "email" to (user.email ?: ""),
                            "studyStyle" to "mixto",
                            "preferredIntensity" to "suave",
                            "currentGoal" to "organizacion",
                            "tonoCapitan" to "poetico",
                            "notaCapitan" to "",
                            "frasePersonal" to "",
                            "totalStudyActions" to 0,
                            "createdAt" to System.currentTimeMillis(),
                            "updatedAt" to System.currentTimeMillis()
                        )
                    ).await()
                }

                val data = ref.get().await()

                _uiState.value = ProfileUiState(
                    isLoading = false,
                    displayName = data.getString("displayName") ?: user.displayName ?: "",
                    email = data.getString("email") ?: user.email ?: "",
                    studyStyle = data.getString("studyStyle") ?: "mixto",
                    preferredIntensity = data.getString("preferredIntensity") ?: "suave",
                    currentGoal = data.getString("currentGoal") ?: "organizacion",
                    tonoCapitan = data.getString("tonoCapitan") ?: "poetico",
                    notaCapitan = data.getString("notaCapitan") ?: "",
                    frasePersonal = data.getString("frasePersonal") ?: "",
                    totalStudyActions = data.getLong("totalStudyActions") ?: 0
                )

            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun updateDisplayName(value: String) {
        _uiState.value = _uiState.value.copy(displayName = value)
    }

    fun updateStudyStyle(value: String) {
        _uiState.value = _uiState.value.copy(studyStyle = value)
    }

    fun updateIntensity(value: String) {
        _uiState.value = _uiState.value.copy(preferredIntensity = value)
    }

    fun updateGoal(value: String) {
        _uiState.value = _uiState.value.copy(currentGoal = value)
    }

    fun updateTonoCapitan(value: String) {
        _uiState.value = _uiState.value.copy(tonoCapitan = value)
    }

    fun updateNotaCapitan(value: String) {
        _uiState.value = _uiState.value.copy(notaCapitan = value)
    }

    fun updateFrasePersonal(value: String) {
        _uiState.value = _uiState.value.copy(frasePersonal = value)
    }

    fun saveProfile() {
        viewModelScope.launch {
            try {
                val user = auth.currentUser ?: return@launch
                val state = _uiState.value

                _uiState.value = state.copy(saving = true)

                val request = com.google.firebase.auth.UserProfileChangeRequest.Builder()
                    .setDisplayName(state.displayName.trim())
                    .build()

                user.updateProfile(request).await()

                db.collection("userProfiles")
                    .document(user.uid)
                    .set(
                        mapOf(
                            "uid" to user.uid,
                            "displayName" to state.displayName.trim(),
                            "email" to state.email,
                            "studyStyle" to state.studyStyle,
                            "preferredIntensity" to state.preferredIntensity,
                            "currentGoal" to state.currentGoal,
                            "tonoCapitan" to state.tonoCapitan,
                            "notaCapitan" to state.notaCapitan,
                            "frasePersonal" to state.frasePersonal,
                            "totalStudyActions" to state.totalStudyActions,
                            "updatedAt" to System.currentTimeMillis()
                        ),
                        com.google.firebase.firestore.SetOptions.merge()
                    )
                    .await()

                _uiState.value = _uiState.value.copy(saving = false)

            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    saving = false,
                    error = e.message
                )
            }
        }
    }
}