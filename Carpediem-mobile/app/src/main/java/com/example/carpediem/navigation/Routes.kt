package com.example.carpediem.navigation


sealed class Routes(val route: String) {
    data object Login       : Routes("login")
    data object Onboarding  : Routes("onboarding")
    data object CheckIn     : Routes("checkin")
    data object Dashboard   : Routes("dashboard")
    data object Notes       : Routes("notes")
    data object Calendar    : Routes("calendar")
    data object Chat        : Routes("chat")
    data object Schedule    : Routes("schedule")
    data object Games       : Routes("games")
    data object Profile     : Routes("profile")

    data object Flashcards : Routes("flashcards")

    // Ruta con argumento — la plantilla incluye {subjectId} para NavHost
    object SubjectDetail {
        const val ARG = "subjectId"
        const val route = "subjectDetail/{$ARG}"

        fun createRoute(subjectId: String): String {
            return "subjectDetail/$subjectId"
        }
    }
}