import Foundation
import Combine

class APIClient: ObservableObject {
    static let shared = APIClient()
    
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    let baseURL = "https://messengertest.shop/api"
    private var token: String? {
        didSet {
            if let token = token {
                UserDefaults.standard.set(token, forKey: "vortex_token")
            } else {
                UserDefaults.standard.removeObject(forKey: "vortex_token")
            }
        }
    }
    
    init() {
        self.token = UserDefaults.standard.string(forKey: "vortex_token")
        self.isAuthenticated = self.token != nil
    }
    
    func getAssetUrl(path: String?) -> URL? {
        guard let path = path else { return nil }
        if path.hasPrefix("http") { return URL(string: path) }
        let trimmedPath = path.hasPrefix("/") ? String(path.dropFirst()) : path
        return URL(string: "https://messengertest.shop/\(trimmedPath)")
    }
    
    // Generic request helper
    private func request<T: Decodable>(endpoint: String, method: String = "GET", body: Data? = nil) async throws -> T {
        guard let url = URL(string: baseURL + endpoint) else {
            throw URLError(.badURL)
        }
        
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let token = token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        req.httpBody = body
        
        let (data, response) = try await URLSession.shared.data(for: req)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        
        if !(defaultRange ~= httpResponse.statusCode) {
            if let errorMsg = try? JSONDecoder().decode(ErrorResponse.self, from: data) {
                 throw NSError(domain: "", code: httpResponse.statusCode, userInfo: [NSLocalizedDescriptionKey: errorMsg.error ?? "Unknown error"])
            }
            throw URLError(.badServerResponse)
        }
        
        let decoder = JSONDecoder()
        
        // Custom date decoder for matching TS ISO formats if needed
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        decoder.dateDecodingStrategy = .custom({ decoder in
            let container = try decoder.singleValueContainer()
            let dateString = try container.decode(String.self)
            if let date = formatter.date(from: dateString) { return date }
            let fallbackFormatter = ISO8601DateFormatter()
            if let date = fallbackFormatter.date(from: dateString) { return date }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Invalid date: \(dateString)")
        })
        
        return try decoder.decode(T.self, from: data)
    }

    struct ErrorResponse: Decodable { let error: String? }
    private var defaultRange: Range<Int> = 200..<300
    
    // MARK: - Auth
    
    func login(username: String, password: String) async throws {
        let body = try JSONSerialization.data(withJSONObject: ["username": username, "password": password])
        let response: AuthResponse = try await request(endpoint: "/auth/login", method: "POST", body: body)
        
        DispatchQueue.main.async {
            self.token = response.token
            self.currentUser = response.user
            self.isAuthenticated = true
        }
    }
    
    func logout() {
        DispatchQueue.main.async {
            self.token = nil
            self.currentUser = nil
            self.isAuthenticated = false
        }
    }
}
