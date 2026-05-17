package com.example.carpediem.presentation.notes

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.example.carpediem.data.remote.firebase.SubjectFileDto
import com.example.carpediem.ui.theme.EmotionColorManager
import com.example.carpediem.ui.theme.emotionAccentColor
import com.example.carpediem.ui.theme.emotionBackgroundColor
import com.example.carpediem.ui.theme.emotionCardColor

@Composable
fun SubjectDetailScreen(
    subjectId: String,
    onBackClick: () -> Unit,
    viewModel: SubjectDetailViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    val nivel by EmotionColorManager.nivelEmocion.collectAsState()
    val background = emotionBackgroundColor(nivel)
    val cardColor = emotionCardColor(nivel)
    val accentColor = emotionAccentColor(nivel)

    val titleColor = Color(0xFF27500A)

    val pdfLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        if (uri != null) {
            val fileName = uri.lastPathSegment ?: "archivo.pdf"

            viewModel.uploadFile(
                subjectId = subjectId,
                uri = uri,
                fileName = fileName
            )
        }
    }

    LaunchedEffect(subjectId) {
        viewModel.loadFiles(subjectId)
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = "← Volver",
                color = titleColor,
                fontWeight = FontWeight.SemiBold,
                modifier = Modifier.clickable {
                    onBackClick()
                }
            )
        }

        item {
            Text(
                text = "📚 Detalle de materia",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = titleColor
            )

            Text(
                text = "ID: $subjectId",
                color = Color.Gray,
                style = MaterialTheme.typography.bodySmall
            )
        }

        item {
            DetailCard(
                title = "📤 Subir archivos",
                text = "Agrega PDFs o documentos para estudiar con el Capitán.",
                buttonText = "Seleccionar PDF",
                cardColor = cardColor,
                buttonColor = accentColor,
                onClick = {
                    pdfLauncher.launch("application/pdf")
                }
            )
        }

        if (state.isLoading) {
            item {
                Row(
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(24.dp),
                        strokeWidth = 2.dp,
                        color = titleColor
                    )

                    Spacer(modifier = Modifier.width(12.dp))

                    Text(
                        text = "Subiendo archivo...",
                        color = Color.Gray
                    )
                }
            }
        }

        item {
            Text(
                text = "📄 Archivos",
                color = titleColor,
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
        }

        if (state.files.isEmpty()) {
            item {
                Card(
                    shape = RoundedCornerShape(18.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = cardColor
                    )
                ) {
                    Text(
                        text = "No hay archivos todavía.",
                        modifier = Modifier.padding(20.dp),
                        color = Color.Gray
                    )
                }
            }
        } else {
            items(state.files) { file ->
                FileCard(
                    file = file,
                    cardColor = cardColor
                )
            }
        }

        item {
            DetailCard(
                title = "⏳ Capitán",
                text = "Pronto podrás hablar con el Capitán usando estos apuntes.",
                buttonText = "Próximamente",
                cardColor = cardColor,
                buttonColor = accentColor.copy(alpha = 0.65f),
                onClick = {}
            )
        }

        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }
}

@Composable
private fun FileCard(
    file: SubjectFileDto,
    cardColor: Color
) {
    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = cardColor
        )
    ) {
        Column(
            modifier = Modifier.padding(18.dp)
        ) {
            Text(
                text = "📄 ${file.fileName}",
                fontWeight = FontWeight.Bold,
                color = Color(0xFF27500A)
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Archivo sincronizado en Firebase",
                color = Color.Gray,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
private fun DetailCard(
    title: String,
    text: String,
    buttonText: String,
    cardColor: Color,
    buttonColor: Color,
    onClick: () -> Unit
) {
    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = cardColor
        )
    ) {
        Column(
            modifier = Modifier.padding(18.dp)
        ) {
            Text(
                text = title,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF27500A)
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = text,
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(14.dp))

            Button(
                onClick = onClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = buttonColor,
                    contentColor = Color(0xFF27500A)
                ),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text(buttonText)
            }
        }
    }
}