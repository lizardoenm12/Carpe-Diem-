package com.example.carpediem.data.remote.firebase

data class CheckInDto(
    val uid: String = "",
    val fecha: String = "",
    val nivelEmocion: Int = 5,
    val color: String = "#E1F5EE",
    val estado: String = "estable",
    val createdAt: Long = System.currentTimeMillis()
)