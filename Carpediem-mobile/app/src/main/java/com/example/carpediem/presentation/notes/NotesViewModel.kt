package com.example.carpediem.presentation.notes

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.carpediem.data.repository.SubjectRepository
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch
import com.google.firebase.auth.FirebaseAuth


class NotesViewModel(
    private val repository: SubjectRepository
) : ViewModel() {

    private val uid = FirebaseAuth.getInstance().currentUser?.uid ?: ""

    val subjects = repository.getSubjectsByUser(uid)
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = emptyList()
        )

    fun createSubject(name: String) {
        val cleanName = name.trim()
        if (cleanName.isBlank()) return
        if (uid.isBlank()) return

        viewModelScope.launch {
            repository.createSubject(uid, cleanName)
            sync()
        }
    }
    fun sync() {
        val uid = FirebaseAuth.getInstance().currentUser?.uid ?: return

        viewModelScope.launch {
            repository.syncSubjects(uid)
        }
    }
    fun deleteSubject(subjectId: String) {
        viewModelScope.launch {
            repository.deleteSubject(subjectId)
            sync()
        }
    }

}