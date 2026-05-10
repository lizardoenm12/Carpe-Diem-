package com.example.carpediem.presentation.notes


import android.net.Uri
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.carpediem.data.remote.firebase.SubjectFileDto
import com.example.carpediem.data.remote.firebase.SubjectFileRemoteDataSource
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

data class SubjectDetailUiState(
    val isLoading: Boolean = false,
    val files: List<SubjectFileDto> = emptyList(),
    val error: String? = null
)

class SubjectDetailViewModel : ViewModel() {

    private val remote = SubjectFileRemoteDataSource()

    private val _uiState = MutableStateFlow(
        SubjectDetailUiState()
    )

    val uiState: StateFlow<SubjectDetailUiState> = _uiState

    fun loadFiles(subjectId: String) {

        viewModelScope.launch {

            try {

                val files = remote.getFiles(subjectId)

                _uiState.value = _uiState.value.copy(
                    files = files
                )

            } catch (e: Exception) {

                _uiState.value = _uiState.value.copy(
                    error = e.message
                )
            }
        }
    }

    fun uploadFile(
        subjectId: String,
        uri: Uri,
        fileName: String
    ) {

        viewModelScope.launch {

            try {

                _uiState.value = _uiState.value.copy(
                    isLoading = true
                )

                remote.uploadFile(
                    subjectId,
                    uri,
                    fileName
                )

                loadFiles(subjectId)

                _uiState.value = _uiState.value.copy(
                    isLoading = false
                )

            } catch (e: Exception) {

                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = e.message
                )
            }
        }
    }
}