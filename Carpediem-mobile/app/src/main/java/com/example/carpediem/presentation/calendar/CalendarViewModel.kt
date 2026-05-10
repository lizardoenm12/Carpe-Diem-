package com.example.carpediem.presentation.calendar

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.carpediem.data.remote.firebase.CalendarEventDto
import com.example.carpediem.data.remote.firebase.CalendarRemoteDataSource
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class CalendarUiState(
    val isLoading: Boolean = true,
    val events: List<CalendarEventDto> = emptyList(),
    val error: String? = null
)

class CalendarViewModel : ViewModel() {

    private val remoteDataSource = CalendarRemoteDataSource()
    private val auth = FirebaseAuth.getInstance()

    private val _uiState = MutableStateFlow(CalendarUiState())
    val uiState: StateFlow<CalendarUiState> = _uiState

    init {
        loadEvents()
    }

    fun loadEvents() {
        viewModelScope.launch {

            try {

                val user = auth.currentUser

                if (user == null) {
                    _uiState.value = CalendarUiState(
                        isLoading = false,
                        error = "Usuario no autenticado"
                    )
                    return@launch
                }

                val events = remoteDataSource.getEvents(user.uid)

                _uiState.value = CalendarUiState(
                    isLoading = false,
                    events = events
                )

            } catch (e: Exception) {

                _uiState.value = CalendarUiState(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }

    fun toggleCompleted(
        eventId: String,
        completed: Boolean
    ) {

        viewModelScope.launch {

            try {

                remoteDataSource.updateCompleted(
                    eventId,
                    completed
                )

                loadEvents()

            } catch (_: Exception) {

            }
        }
    }

    fun addEvent(
        titulo: String,
        descripcion: String,
        tipo: String,
        fechaMillis: Long
    ) {
        viewModelScope.launch {
            try {
                if (titulo.isBlank()) return@launch

                remoteDataSource.addEvent(
                    titulo = titulo.trim(),
                    descripcion = descripcion.trim(),
                    tipo = tipo,
                    fechaMillis = fechaMillis
                )

                loadEvents()

            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message
                )
            }
        }
    }

    fun deleteEvent(eventId: String) {
        viewModelScope.launch {
            try {
                remoteDataSource.deleteEvent(eventId)
                loadEvents()
            } catch (e: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = e.message
                )
            }
        }
    }
}