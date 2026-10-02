import Foundation

enum TokenFileError: Error {
    case unreadable(String)
    case unresolved(String)
}

struct TokenFile {
    let values: [String: Any]

    init(_ name: String) throws {
        let root = URL(fileURLWithPath: #filePath)
            .deletingLastPathComponent().deletingLastPathComponent().deletingLastPathComponent()
        let data = try Data(contentsOf: root.appending(path: "tokens/\(name).json"))
        guard let object = try JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            throw TokenFileError.unreadable(name)
        }
        values = object
    }

    func group(_ name: String) throws -> [String: Any] {
        guard let group = values[name] as? [String: Any] else {
            throw TokenFileError.unreadable(name)
        }
        return group
    }

    func resolved(_ group: String, _ key: String) throws -> Any {
        let tokens = try self.group(group)
        guard let token = tokens[key] as? [String: Any], let value = token["$value"] else {
            throw TokenFileError.unresolved("\(group).\(key)")
        }
        if let reference = value as? String, reference.hasPrefix("{"), reference.hasSuffix("}") {
            let parts = reference.dropFirst().dropLast().split(separator: ".").map(String.init)
            guard parts.count == 2, parts[0] == group else {
                throw TokenFileError.unresolved(reference)
            }
            return try resolved(group, parts[1])
        }
        return value
    }

    var tokenNames: [String] {
        values.values.compactMap { $0 as? [String: Any] }
            .flatMap { $0.keys.filter { !$0.hasPrefix("$") } }
    }
}
