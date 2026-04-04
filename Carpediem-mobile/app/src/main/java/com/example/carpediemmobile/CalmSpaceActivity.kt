package com.example.carpediemmobile

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.Card
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

class CalmSpaceActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            CalmSpaceScreen()
        }
    }
}

data class Emotion(
    val name: String,
    val emoji: String,
    val color: Color
)

@Composable
fun CalmSpaceScreen() {

    val emotions = listOf(
        Emotion("Furioso","😠",Color(0xFFEE9A8D)),
        Emotion("Enojado","☹️",Color(0xFFF2AB87)),
        Emotion("Molesto","😐",Color(0xFFF2C16B)),
        Emotion("Triste","😢",Color(0xFFEADC7B)),
        Emotion("Ansioso","😟",Color(0xFFD8DD87)),
        Emotion("Feliz","♡",Color(0xFF9ED39E))
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF4F8FC))
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {

        Text(
            "Tu Espacio de Calma",
            fontSize = 28.sp,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF4C6FA8)
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            "Un día a la vez, un paso a la vez",
            color = Color(0xFF6E86B3)
        )

        Spacer(modifier = Modifier.height(30.dp))

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            verticalArrangement = Arrangement.spacedBy(20.dp),
            horizontalArrangement = Arrangement.spacedBy(20.dp)
        ) {

            items(emotions) { emotion ->

                Card(
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.height(150.dp)
                ) {

                    Column(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Color(0xFFF6F8FB)),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.Center
                    ) {

                        Text(
                            emotion.emoji,
                            fontSize = 30.sp
                        )

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            emotion.name,
                            fontSize = 18.sp
                        )

                    }

                }

            }

        }

    }

}