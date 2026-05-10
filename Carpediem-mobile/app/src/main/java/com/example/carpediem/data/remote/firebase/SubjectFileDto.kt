package com.example.carpediem.data.remote.firebase

data class SubjectFileDto(
    val id: String = "",
    val subjectId: String = "",
    val uid: String = "",
    val fileName: String = "",
    val downloadUrl: String = "",
    val createdAt: Long = System.currentTimeMillis()
)