package com.example.carpediem.presentation.chat

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Send
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

@Composable
fun ChatCapitanScreen(
    viewModel: ChatCapitanViewModel = viewModel()
) {

    val state by viewModel.uiState.collectAsState()

    val background = Color(0xFFF5F5DC)
    val greenAccent = Color(0xFFE1F5EE)
    val greenButton = Color(0xFFB2D8B2)

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
    ) {

        Column(
            modifier = Modifier.padding(20.dp)
        ) {

            Text(
                text = "⏳ El Capitán",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF27500A)
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Tu guía adaptativa",
                color = Color.Gray
            )
        }

        LazyColumn(
            modifier = Modifier
                .weight(1f)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp)
        ) {

            items(state.messages) { message ->

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = if (message.isUser) {
                        Arrangement.End
                    } else {
                        Arrangement.Start
                    }
                ) {

                    Surface(
                        color = if (message.isUser) {
                            greenButton
                        } else {
                            Color.White
                        },
                        shape = RoundedCornerShape(18.dp)
                    ) {

                        Text(
                            text = message.text,
                            modifier = Modifier.padding(14.dp),
                            color = Color(0xFF333333)
                        )
                    }
                }
            }

            if (state.isLoading) {

                item {

                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(10.dp))
            }
        }

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(14.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {

            OutlinedTextField(
                value = state.currentInput,
                onValueChange = viewModel::updateInput,
                modifier = Modifier.weight(1f),
                placeholder = {
                    Text("Habla con el Capitán...")
                },
                shape = RoundedCornerShape(20.dp)
            )

            Spacer(modifier = Modifier.width(10.dp))

            FloatingActionButton(
                onClick = {
                    viewModel.sendMessage()
                },
                containerColor = greenButton
            ) {

                Icon(
                    imageVector = Icons.Default.Send,
                    contentDescription = "Enviar",
                    tint = Color(0xFF27500A)
                )
            }
        }
    }
}