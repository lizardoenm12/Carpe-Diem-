package com.example.carpediem.presentation.games

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

data class Flashcard(
    val question: String,
    val answer: String
)

@Composable
fun FlashcardsScreen(
    onBackClick: () -> Unit
) {
    val flashcards = remember {
        listOf(
            Flashcard(
                "¿Qué es una variable?",
                "Es un espacio de memoria que almacena datos."
            ),
            Flashcard(
                "¿Qué es Firebase?",
                "Es una plataforma de backend de Google."
            ),
            Flashcard(
                "¿Qué hace Compose?",
                "Permite crear interfaces modernas en Android."
            )
        )
    }

    var currentIndex by remember { mutableStateOf(0) }
    var showAnswer by remember { mutableStateOf(false) }

    val currentCard = flashcards[currentIndex]

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF5F5DC))
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(18.dp)
    ) {
        Text(
            text = "← Volver",
            color = Color(0xFF27500A),
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.clickable {
                onBackClick()
            }
        )

        Text(
            text = "🃏 Flashcards",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF27500A)
        )

        Text(
            text = "Repasa conceptos importantes rápidamente.",
            color = Color.Gray
        )

        Spacer(modifier = Modifier.height(12.dp))

        Card(
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            shape = RoundedCornerShape(28.dp),
            colors = CardDefaults.cardColors(
                containerColor = Color.White
            )
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(28.dp),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = if (showAnswer) "Respuesta" else "Pregunta",
                        color = Color.Gray
                    )

                    Spacer(modifier = Modifier.height(20.dp))

                    Text(
                        text = if (showAnswer)
                            currentCard.answer
                        else
                            currentCard.question,
                        style = MaterialTheme.typography.headlineSmall,
                        fontWeight = FontWeight.Bold,
                        color = Color(0xFF27500A)
                    )
                }
            }
        }

        Button(
            onClick = {
                showAnswer = !showAnswer
            },
            modifier = Modifier.fillMaxWidth(),
            shape = RoundedCornerShape(16.dp),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFFB2D8B2),
                contentColor = Color(0xFF27500A)
            )
        ) {
            Text(
                if (showAnswer)
                    "Ocultar respuesta"
                else
                    "Mostrar respuesta"
            )
        }

        Row(
            horizontalArrangement = Arrangement.spacedBy(12.dp)
        ) {
            OutlinedButton(
                onClick = {
                    if (currentIndex > 0) {
                        currentIndex--
                        showAnswer = false
                    }
                },
                modifier = Modifier.weight(1f)
            ) {
                Text("Anterior")
            }

            Button(
                onClick = {
                    if (currentIndex < flashcards.lastIndex) {
                        currentIndex++
                        showAnswer = false
                    }
                },
                modifier = Modifier.weight(1f),
                colors = ButtonDefaults.buttonColors(
                    containerColor = Color(0xFF27500A),
                    contentColor = Color.White
                )
            ) {
                Text("Siguiente")
            }
        }

        Text(
            text = "${currentIndex + 1} / ${flashcards.size}",
            color = Color.Gray,
            modifier = Modifier.align(Alignment.CenterHorizontally)
        )
    }
}