// Native UI input and read-only screen metadata for the isolated promo runner.
// OCR x/y use screenshot pixels; CGEvent input uses global display points.
import Cocoa
import Vision
import ApplicationServices
import ImageIO

enum ToolError: Error { case invalid(String) }
let args = CommandLine.arguments

func emit(_ value: Any) throws {
    let data = try JSONSerialization.data(withJSONObject: value, options: [.sortedKeys])
    print(String(data: data, encoding: .utf8)!)
}

func number(_ index: Int) throws -> Double {
    guard args.count > index, let value = Double(args[index]), value.isFinite else {
        throw ToolError.invalid("Expected a finite number at argument \(index)")
    }
    return value
}

func rectangle(_ rect: CGRect) -> [String: Any] {
    ["x": Double(rect.origin.x), "y": Double(rect.origin.y),
     "width": Double(rect.width), "height": Double(rect.height)]
}

func modeInfo(_ mode: CGDisplayMode) -> [String: Any] {
    ["id": mode.ioDisplayModeID, "width": mode.width, "height": mode.height,
     "pixelWidth": mode.pixelWidth, "pixelHeight": mode.pixelHeight,
     "refreshRate": mode.refreshRate,
     "usableForDesktopGUI": mode.isUsableForDesktopGUI()]
}

func modes(_ display: CGDirectDisplayID) -> [CGDisplayMode] {
    CGDisplayCopyAllDisplayModes(display, nil) as? [CGDisplayMode] ?? []
}

func displayInfo(_ display: CGDirectDisplayID) -> [String: Any] {
    let bounds = CGDisplayBounds(display)
    var item: [String: Any] = [
        "id": display, "main": display == CGMainDisplayID(),
        "bounds": rectangle(bounds), "pixelWidth": CGDisplayPixelsWide(display),
        "pixelHeight": CGDisplayPixelsHigh(display),
        "scaleX": Double(CGDisplayPixelsWide(display)) / max(1, Double(bounds.width)),
        "scaleY": Double(CGDisplayPixelsHigh(display)) / max(1, Double(bounds.height)),
        "modes": modes(display).map(modeInfo)
    ]
    if let mode = CGDisplayCopyDisplayMode(display) { item["currentMode"] = modeInfo(mode) }
    return item
}

func metadata(_ pid: Int32?) throws {
    var count: UInt32 = 0
    guard CGGetActiveDisplayList(0, nil, &count) == .success else {
        throw ToolError.invalid("Cannot enumerate active displays")
    }
    var displays = [CGDirectDisplayID](repeating: 0, count: Int(count))
    let result = displays.withUnsafeMutableBufferPointer {
        CGGetActiveDisplayList(count, $0.baseAddress, &count)
    }
    guard result == .success else { throw ToolError.invalid("Cannot read active displays") }
    let all = CGWindowListCopyWindowInfo([.optionOnScreenOnly, .excludeDesktopElements],
                                       kCGNullWindowID) as? [[String: Any]] ?? []
    let windows: [[String: Any]] = all.compactMap { item in
        guard let ownerPID = (item[kCGWindowOwnerPID as String] as? NSNumber)?.int32Value,
              pid == nil || ownerPID == pid else { return nil }
        var value: [String: Any] = ["pid": ownerPID]
        for (source, target) in [(kCGWindowNumber as String, "id"),
                                 (kCGWindowName as String, "title"),
                                 (kCGWindowOwnerName as String, "owner"),
                                 (kCGWindowLayer as String, "layer"),
                                 (kCGWindowBounds as String, "bounds"),
                                 (kCGWindowIsOnscreen as String, "onScreen")] {
            if let present = item[source] { value[target] = present }
        }
        return value
    }
    let cursor = CGEvent(source: nil)?.location ?? .zero
    try emit(["mainDisplayID": CGMainDisplayID(),
              "displays": displays.prefix(Int(count)).map(displayInfo),
              "windows": windows,
              "cursor": ["x": Double(cursor.x), "y": Double(cursor.y)]])
}

func setDisplaySize(_ width: Double, _ height: Double) throws {
    let display = CGMainDisplayID()
    let candidates = modes(display).filter {
        $0.width >= 1280 && $0.height >= 860 && $0.isUsableForDesktopGUI()
    }
    func score(_ mode: CGDisplayMode) -> Double {
        let dx = (Double(mode.width) - width) / width
        let dy = (Double(mode.height) - height) / height
        return dx * dx + dy * dy
    }
    guard width > 0, height > 0 else { throw ToolError.invalid("Display size must be positive") }
    guard let selected = candidates.min(by: { score($0) < score($1) }) else {
        try emit(["changed": false, "reason": "No available mode is at least 1280x860",
                  "display": displayInfo(display)])
        return
    }
    var configuration: CGDisplayConfigRef?
    var result = CGBeginDisplayConfiguration(&configuration)
    guard result == .success, let config = configuration else {
        try emit(["changed": false, "reason": "Cannot begin display configuration",
                  "error": result.rawValue, "display": displayInfo(display)])
        return
    }
    result = CGConfigureDisplayWithDisplayMode(config, display, selected, nil)
    if result == .success {
        result = CGCompleteDisplayConfiguration(config, .forSession)
    } else {
        CGCancelDisplayConfiguration(config)
    }
    if result == .success { usleep(700_000) }
    try emit(["changed": result == .success, "error": result.rawValue,
              "selectedMode": modeInfo(selected), "display": displayInfo(display)])
}

func recognize(_ path: String) throws {
    let url = URL(fileURLWithPath: path)
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw ToolError.invalid("Cannot read image: \(path)")
    }
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate
    request.recognitionLanguages = ["zh-Hans", "en-US"]
    try VNImageRequestHandler(cgImage: image).perform([request])
    let output = (request.results ?? []).compactMap { item -> [String: Any]? in
        guard let candidate = item.topCandidates(1).first else { return nil }
        let box = item.boundingBox
        return ["text": candidate.string, "confidence": candidate.confidence,
                "x": (box.minX + box.width / 2) * Double(image.width),
                "y": (1 - box.minY - box.height / 2) * Double(image.height),
                "width": box.width * Double(image.width),
                "height": box.height * Double(image.height)]
    }
    try emit(output)
}

func move(_ point: CGPoint, duration: Double) {
    let start = CGEvent(source: nil)?.location ?? point
    let bounded = max(0, min(duration, 10))
    let steps = max(1, Int(bounded * 60))
    for step in 1...steps {
        let t = Double(step) / Double(steps)
        let smooth = t * t * (3 - 2 * t)
        let next = CGPoint(x: start.x + (point.x - start.x) * smooth,
                           y: start.y + (point.y - start.y) * smooth)
        CGEvent(mouseEventSource: nil, mouseType: .mouseMoved,
                mouseCursorPosition: next, mouseButton: .left)?.post(tap: .cghidEventTap)
        if bounded > 0 { usleep(UInt32(bounded / Double(steps) * 1_000_000)) }
    }
}

do {
    guard args.count > 1 else { throw ToolError.invalid("Missing command or image path") }
    switch args[1] {
    case "metadata":
        let pid = args.count > 2 ? Int32(args[2]) : nil
        if args.count > 2 && pid == nil { throw ToolError.invalid("Invalid PID") }
        try metadata(pid)
    case "display-size":
        try setDisplaySize(number(2), number(3))
    case "ocr":
        guard args.count > 2 else { throw ToolError.invalid("Missing image path") }
        try recognize(args[2])
    case "move":
        let point = CGPoint(x: try number(2), y: try number(3))
        move(point, duration: args.count > 4 ? try number(4) : 0.5)
    case "click":
        let point = CGPoint(x: try number(2), y: try number(3))
        move(point, duration: 0.3)
        CGEvent(mouseEventSource: nil, mouseType: .leftMouseDown,
                mouseCursorPosition: point, mouseButton: .left)?.post(tap: .cghidEventTap)
        usleep(120_000)
        CGEvent(mouseEventSource: nil, mouseType: .leftMouseUp,
                mouseCursorPosition: point, mouseButton: .left)?.post(tap: .cghidEventTap)
    case "scroll":
        let distance = Int32(max(-10_000, min(10_000, try number(2))))
        CGEvent(scrollWheelEvent2Source: nil, units: .pixel, wheelCount: 1,
                wheel1: distance, wheel2: 0, wheel3: 0)?.post(tap: .cghidEventTap)
    case "key":
        let keys: [String: CGKeyCode] = ["escape": 53, "return": 36, "tab": 48,
                                        "space": 49, "left": 123, "right": 124,
                                        "down": 125, "up": 126]
        guard args.count > 2, let key = keys[args[2]] else {
            throw ToolError.invalid("Unsupported key")
        }
        CGEvent(keyboardEventSource: nil, virtualKey: key, keyDown: true)?.post(tap: .cghidEventTap)
        usleep(80_000)
        CGEvent(keyboardEventSource: nil, virtualKey: key, keyDown: false)?.post(tap: .cghidEventTap)
    default:
        try recognize(args[1])
    }
} catch {
    FileHandle.standardError.write(Data("screen: \(error)\n".utf8))
    exit(2)
}
