import SwiftUI

@main
struct MessengerTestApp: App {
    @StateObject private var api = APIClient.shared
    
    var body: some Scene {
        WindowGroup {
            if api.isAuthenticated {
                MainTabView()
            } else {
                AuthView()
            }
        }
    }
}
