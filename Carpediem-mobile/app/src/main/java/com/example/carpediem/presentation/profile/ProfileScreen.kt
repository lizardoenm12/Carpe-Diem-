package com.example.carpediem.presentation.profile

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.google.firebase.auth.FirebaseAuth

@Composable
fun ProfileScreen(
    onBackClick: () -> Unit,
    onLogout: () -> Unit,
    viewModel: ProfileViewModel = viewModel()
) {
    val state by viewModel.uiState.collectAsState()

    if (state.isLoading) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color(0xFFF5F5DC)),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
        return
    }

    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .background(Color(0xFFF5F5DC))
            .padding(20.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) { item {
        Text(
            text = "← Volver",
            color = Color(0xFF27500A),
            fontWeight = FontWeight.SemiBold,
            modifier = Modifier.clickable { onBackClick() }
        )

        Text(
            text = "Mi perfil",
            style = MaterialTheme.typography.headlineSmall,
            fontWeight = FontWeight.Bold,
            color = Color(0xFF27500A)
        )

        Text(
            text = "Personaliza cómo Carpe Diem adapta tu estudio.",
            color = Color.Gray
        )

        ProfileHeaderCard(state)

        ProfileTextField(
            label = "Nombre",
            value = state.displayName,
            onValueChange = viewModel::updateDisplayName
        )

        OptionSection(
            title = "Estilo de estudio",
            selected = state.studyStyle,
            options = listOf(
                "visual" to "Visual",
                "lectura" to "Lectura",
                "practico" to "Práctico",
                "mixto" to "Mixto"
            ),
            onSelect = viewModel::updateStudyStyle
        )

        OptionSection(
            title = "Intensidad preferida",
            selected = state.preferredIntensity,
            options = listOf(
                "suave" to "Suave",
                "normal" to "Normal",
                "intensa" to "Intensa"
            ),
            onSelect = viewModel::updateIntensity
        )

        OptionSection(
            title = "Meta actual",
            selected = state.currentGoal,
            options = listOf(
                "organizacion" to "Organizar mi estudio",
                "examen" to "Preparar examen",
                "tareas" to "Terminar tareas",
                "repaso" to "Repasar contenido"
            ),
            onSelect = viewModel::updateGoal
        )

        OptionSection(
            title = "Tono del Capitán",
            selected = state.tonoCapitan,
            options = listOf(
                "poetico" to "Poético",
                "directo" to "Directo",
                "mixto" to "Mixto"
            ),
            onSelect = viewModel::updateTonoCapitan
        )

        ProfileTextField(
            label = "Nota para el Capitán",
            value = state.notaCapitan,
            onValueChange = viewModel::updateNotaCapitan
        )

        ProfileTextField(
            label = "Frase personal",
            value = state.frasePersonal,
            onValueChange = viewModel::updateFrasePersonal
        )
    }
    item {
        Button(
            onClick = { viewModel.saveProfile() },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color(0xFFB2D8B2),
                contentColor = Color(0xFF27500A)
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text(if (state.saving) "Guardando..." else "Guardar cambios")
        }

        Button(
            onClick = {
                FirebaseAuth.getInstance().signOut()
                onLogout()
            },
            modifier = Modifier.fillMaxWidth(),
            colors = ButtonDefaults.buttonColors(
                containerColor = Color.White,
                contentColor = Color(0xFF27500A)
            ),
            shape = RoundedCornerShape(16.dp)
        ) {
            Text("Cerrar sesión")
        }
    }
    }
}

@Composable
private fun ProfileHeaderCard(state: ProfileUiState) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(24.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier.padding(22.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Surface(
                modifier = Modifier.size(82.dp),
                shape = CircleShape,
                color = Color(0xFFE1F5EE)
            ) {
                Box(contentAlignment = Alignment.Center) {
                    Text(
                        text = getInitials(state.displayName),
                        color = Color(0xFF27500A),
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            Text(
                text = state.displayName.ifBlank { "Usuario Carpe Diem" },
                fontWeight = FontWeight.Bold,
                color = Color(0xFF27500A)
            )

            Text(
                text = state.email,
                color = Color.Gray,
                style = MaterialTheme.typography.bodySmall
            )

            Spacer(modifier = Modifier.height(8.dp))

            Text(
                text = "${state.totalStudyActions} acciones de estudio registradas",
                color = Color.Gray,
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
private fun ProfileTextField(
    label: String,
    value: String,
    onValueChange: (String) -> Unit
) {
    OutlinedTextField(
        value = value,
        onValueChange = onValueChange,
        label = { Text(label) },
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(16.dp)
    )
}

@Composable
private fun OptionSection(
    title: String,
    selected: String,
    options: List<Pair<String, String>>,
    onSelect: (String) -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(18.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = title,
                color = Color(0xFF27500A),
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(10.dp))

            options.forEach { option ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onSelect(option.first) }
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = selected == option.first,
                        onClick = { onSelect(option.first) }
                    )

                    Text(
                        text = option.second,
                        color = Color(0xFF333333)
                    )
                }
            }
        }
    }
}

private fun getInitials(name: String): String {
    return if (name.isBlank()) {
        "U"
    } else {
        name.split(" ")
            .mapNotNull { it.firstOrNull()?.uppercase() }
            .joinToString("")
            .take(2)
    }
}