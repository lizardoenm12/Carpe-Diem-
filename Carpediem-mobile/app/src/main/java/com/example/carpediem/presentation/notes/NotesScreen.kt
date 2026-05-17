package com.example.carpediem.presentation.notes

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
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.example.carpediem.data.local.DatabaseProvider
import com.example.carpediem.data.remote.firebase.SubjectRemoteDataSource
import com.example.carpediem.data.repository.SubjectRepository
import com.example.carpediem.ui.theme.EmotionColorManager
import com.example.carpediem.ui.theme.emotionAccentColor
import com.example.carpediem.ui.theme.emotionBackgroundColor
import com.example.carpediem.ui.theme.emotionCardColor

@Composable
fun NotesScreen(
    onSubjectClick: (String) -> Unit
) {
    val context = LocalContext.current

    val nivel by EmotionColorManager.nivelEmocion.collectAsState()
    val background = emotionBackgroundColor(nivel)
    val cardColor = emotionCardColor(nivel)
    val accentColor = emotionAccentColor(nivel)

    val db = remember { DatabaseProvider.getDatabase(context) }
    val remote = remember { SubjectRemoteDataSource() }
    val repository = remember { SubjectRepository(db.subjectDao(), remote) }
    val factory = remember { NotesViewModelFactory(repository) }

    val viewModel: NotesViewModel = viewModel(factory = factory)
    val subjects by viewModel.subjects.collectAsState()

    var showCreateDialog by remember { mutableStateOf(false) }
    var newSubject by remember { mutableStateOf("") }

    var subjectToDeleteId by remember { mutableStateOf<String?>(null) }
    var subjectToDeleteName by remember { mutableStateOf("") }

    LaunchedEffect(Unit) {
        viewModel.sync()
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(background)
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            HeaderNotes(
                accentColor = accentColor,
                onAddClick = { showCreateDialog = true }
            )
        }

        if (subjects.isEmpty()) {
            item {
                EmptyNotesCard(
                    cardColor = cardColor,
                    accentColor = accentColor,
                    onAddClick = { showCreateDialog = true }
                )
            }
        } else {
            items(subjects) { subject ->
                SubjectCard(
                    name = subject.name,
                    cardColor = cardColor,
                    onClick = {
                        onSubjectClick(subject.id)
                    },
                    onDeleteClick = {
                        subjectToDeleteId = subject.id
                        subjectToDeleteName = subject.name
                    }
                )
            }
        }

        item {
            Spacer(modifier = Modifier.height(80.dp))
        }
    }

    if (showCreateDialog) {
        CreateSubjectDialog(
            value = newSubject,
            accentColor = accentColor,
            onValueChange = { newSubject = it },
            onDismiss = {
                showCreateDialog = false
                newSubject = ""
            },
            onSave = {
                if (newSubject.isNotBlank()) {
                    viewModel.createSubject(newSubject.trim())
                    newSubject = ""
                    showCreateDialog = false
                }
            }
        )
    }

    if (subjectToDeleteId != null) {
        AlertDialog(
            onDismissRequest = {
                subjectToDeleteId = null
                subjectToDeleteName = ""
            },
            title = {
                Text(
                    text = "Eliminar materia",
                    color = Color(0xFF27500A),
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = "¿Seguro que quieres eliminar \"$subjectToDeleteName\"?",
                    color = Color.Gray
                )
            },
            confirmButton = {
                Button(
                    onClick = {
                        subjectToDeleteId?.let { id ->
                            viewModel.deleteSubject(id)
                        }
                        subjectToDeleteId = null
                        subjectToDeleteName = ""
                    },
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFC75C5C),
                        contentColor = Color.White
                    )
                ) {
                    Text("Eliminar")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        subjectToDeleteId = null
                        subjectToDeleteName = ""
                    }
                ) {
                    Text("Cancelar")
                }
            }
        )
    }
}

@Composable
private fun HeaderNotes(
    accentColor: Color,
    onAddClick: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.Top
    ) {
        Column(
            modifier = Modifier.weight(1f)
        ) {
            Text(
                text = "📚 Apuntes",
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Bold,
                color = Color(0xFF27500A)
            )

            Spacer(modifier = Modifier.height(4.dp))

            Text(
                text = "Organiza tus materias y archivos de estudio.",
                color = Color.Gray,
                style = MaterialTheme.typography.bodyMedium
            )
        }

        Button(
            onClick = onAddClick,
            colors = ButtonDefaults.buttonColors(
                containerColor = accentColor,
                contentColor = Color(0xFF27500A)
            ),
            shape = RoundedCornerShape(14.dp)
        ) {
            Text("+")
        }
    }
}

@Composable
private fun SubjectCard(
    name: String,
    cardColor: Color,
    onClick: () -> Unit,
    onDeleteClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(20.dp),
        colors = CardDefaults.cardColors(
            containerColor = cardColor
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .clickable { onClick() }
                .padding(18.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Surface(
                color = Color(0xFFE1F5EE),
                shape = RoundedCornerShape(14.dp),
                modifier = Modifier.size(52.dp)
            ) {
                Box(
                    contentAlignment = Alignment.Center,
                    modifier = Modifier.fillMaxSize()
                ) {
                    Text("📗")
                }
            }

            Spacer(modifier = Modifier.width(14.dp))

            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = name,
                    fontWeight = FontWeight.Bold,
                    color = Color(0xFF27500A),
                    style = MaterialTheme.typography.titleMedium
                )

                Spacer(modifier = Modifier.height(4.dp))

                Text(
                    text = "Archivos, Capitán y cuestionarios",
                    color = Color.Gray,
                    style = MaterialTheme.typography.bodySmall
                )
            }

            TextButton(
                onClick = onDeleteClick
            ) {
                Text(
                    text = "Eliminar",
                    color = Color(0xFFC75C5C)
                )
            }
        }
    }
}

@Composable
private fun EmptyNotesCard(
    cardColor: Color,
    accentColor: Color,
    onAddClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(22.dp),
        colors = CardDefaults.cardColors(
            containerColor = cardColor
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(28.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "🗂️",
                style = MaterialTheme.typography.headlineLarge
            )

            Spacer(modifier = Modifier.height(12.dp))

            Text(
                text = "Aún no tienes materias creadas.",
                color = Color(0xFF27500A),
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(6.dp))

            Text(
                text = "Agrega una materia para comenzar.",
                color = Color.Gray
            )

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onAddClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = accentColor,
                    contentColor = Color(0xFF27500A)
                ),
                shape = RoundedCornerShape(14.dp)
            ) {
                Text("Agregar materia")
            }
        }
    }
}

@Composable
private fun CreateSubjectDialog(
    value: String,
    accentColor: Color,
    onValueChange: (String) -> Unit,
    onDismiss: () -> Unit,
    onSave: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = {
            Text(
                text = "Crear materia",
                color = Color(0xFF27500A),
                fontWeight = FontWeight.Bold
            )
        },
        text = {
            Column {
                Text(
                    text = "Agrega el nombre de una materia.",
                    color = Color.Gray
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = value,
                    onValueChange = onValueChange,
                    placeholder = {
                        Text("Ej. Física, Cálculo, Programación...")
                    },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            Button(
                onClick = onSave,
                colors = ButtonDefaults.buttonColors(
                    containerColor = accentColor,
                    contentColor = Color(0xFF27500A)
                )
            ) {
                Text("Guardar")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancelar")
            }
        }
    )
}