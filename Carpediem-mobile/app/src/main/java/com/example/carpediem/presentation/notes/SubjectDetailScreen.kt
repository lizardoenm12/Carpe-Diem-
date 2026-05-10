package com.example.carpediem.presentation.notes

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.clickable
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

@Composable
fun SubjectDetailScreen(
    subjectId: String,
    onBackClick: () -> Unit,
    viewModel: SubjectDetailViewModel = viewModel()
) {

    val state by viewModel.uiState.collectAsState()

    val background = Color(0xFFF5F5DC)
    val greenButton = Color(0xFFB2D8B2)
    val greenAccent = Color(0xFFE1F5EE)
    val titleColor = Color(0xFF27500A)

    var selectedFileName by remember {
        mutableStateOf("")
    }

    val pdfLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->

        if (uri != null) {

            val fileName = uri.lastPathSegment ?: "archivo.pdf"

            selectedFileName = fileName

            viewModel.uploadFile(
                subjectId = subjectId,
                uri = uri,
                fileName = fileName
            )
        }
    }

    LaunchedEffect(Unit) {
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
                buttonColor = greenButton,
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
                        strokeWidth = 2.dp
                    )

                    Spacer(modifier = Modifier.width(12.dp))

                    Text("Subiendo archivo...")
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
                    colors = CardDefaults.cardColors(
                        containerColor = Color.White
                    )
                ) {

                    Text(
                        text = "No hay archivos todavía.",
                        modifier = Modifier.padding(20.dp),
                        color = Color.Gray
                    )
                }
            }
        }

        items(state.files) { file ->

            FileCard(file)
        }

        item {

            DetailCard(
                title = "⏳ Capitán",
                text = "Pronto podrás hablar con el Capitán usando estos apuntes.",
                buttonText = "Próximamente",
                buttonColor = greenAccent,
                onClick = {

                }
            )
        }

        item {

            Spacer(modifier = Modifier.height(60.dp))
        }
    }
}

@Composable
private fun FileCard(
    file: SubjectFileDto
) {

    Card(
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
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
    buttonColor: Color,
    onClick: () -> Unit
) {

    Card(
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color.White
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
                )
            ) {

                Text(buttonText)
            }
        }
    }
}