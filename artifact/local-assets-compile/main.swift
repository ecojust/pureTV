
import Foundation
import Darwin
let root = URL(fileURLWithPath: CommandLine.arguments[1], isDirectory: true)
let policy: Any? = CommandLine.arguments.count > 2
    ? try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[2]))) : nil
let server = LocalAssetServer(root: root, policy: policy)
server.start { result in
    switch result {
    case .success(let url): print("READY " + url.absoluteString); fflush(stdout)
    case .failure(let error): print("ERROR " + error.localizedDescription); fflush(stdout); exit(2)
    }
}
RunLoop.main.run()
