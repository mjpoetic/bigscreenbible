import Capacitor
import WidgetKit

@objc(BSBWidgetPlugin)
public class BSBWidgetPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BSBWidgetPlugin"
    public let jsName = "BSBWidget"
    public let pluginMethods: [CAPPluginMethod] = [CAPPluginMethod(name: "sync", returnType: CAPPluginReturnPromise)]
    @objc func sync(_ call: CAPPluginCall) {
        let snapshot = WidgetSnapshot(current: max(0, min(call.getInt("current") ?? 0, 100000)),
            lastVisit: call.getString("lastVisit") ?? "", days: Array((call.getArray("days", String.self) ?? []).suffix(400)))
        Self.store(snapshot)
        call.resolve()
    }
    static func store(_ snapshot: WidgetSnapshot) {
        let encoder = JSONEncoder()
        encoder.outputFormatting = .sortedKeys
        guard let data = try? encoder.encode(snapshot), let defaults = WidgetStore.defaults else { return }
        let changed = data != defaults.data(forKey: "snapshot")
        defaults.set(data, forKey: "snapshot")
        if changed { WidgetCenter.shared.reloadTimelines(ofKind: WidgetStore.kind) }
    }
}
