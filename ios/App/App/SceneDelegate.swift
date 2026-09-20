import UIKit
import Capacitor
import WebKit
import SafariServices

class SceneDelegate: UIResponder, UIWindowSceneDelegate {

    var window: UIWindow?
    private var pendingQuickAction: String?
    private var quickActionRetry: DispatchWorkItem?
    private var quickActionDeliveryInFlight = false
    private var quickActionAttempts = 0

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = scene as? UIWindowScene else {
            return
        }

        let storyboard = UIStoryboard(name: "Main", bundle: nil)
        let window = UIWindow(windowScene: windowScene)
        window.rootViewController = storyboard.instantiateInitialViewController()
        self.window = window
        window.makeKeyAndVisible()

        if let shortcut = connectionOptions.shortcutItem {
            _ = queueQuickAction(shortcut)
        }

        for context in connectionOptions.urlContexts {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [:])
        }

        for userActivity in connectionOptions.userActivities {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        for context in URLContexts {
            _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, open: context.url, options: [:])
        }
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        _ = ApplicationDelegateProxy.shared.application(UIApplication.shared, continue: userActivity, restorationHandler: { _ in })
    }

    func windowScene(_ windowScene: UIWindowScene, performActionFor shortcutItem: UIApplicationShortcutItem,
                     completionHandler: @escaping (Bool) -> Void) {
        completionHandler(queueQuickAction(shortcutItem))
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        quickActionAttempts = 0
        deliverQuickAction()
    }

    func sceneWillResignActive(_ scene: UIScene) {
        quickActionRetry?.cancel()
    }

    private func queueQuickAction(_ item: UIApplicationShortcutItem) -> Bool {
        let prefix = "com.bigscreenbible.app."
        guard item.type.hasPrefix(prefix) else { return false }
        let action = String(item.type.dropFirst(prefix.count))
        guard ["reader", "parallel", "games", "search"].contains(action) else { return false }
        pendingQuickAction = action
        quickActionAttempts = 0
        deliverQuickAction()
        return true
    }

    private func retryQuickAction() {
        quickActionRetry?.cancel()
        // Retain the request for the next activation if the live site is offline
        // or still serving an older web build; do not poll indefinitely.
        guard quickActionAttempts < 200 else { return }
        let retry = DispatchWorkItem { [weak self] in self?.deliverQuickAction() }
        quickActionRetry = retry
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3, execute: retry)
    }

    private func deliverQuickAction() {
        guard let action = pendingQuickAction, !quickActionDeliveryInFlight,
              window?.windowScene?.activationState == .foregroundActive else { return }
        quickActionAttempts += 1
        guard let controller = window?.rootViewController as? CAPBridgeViewController,
              let webView = controller.webView else {
            retryQuickAction()
            return
        }
        // Only fixed, allowlisted action names enter JavaScript. The web handler
        // acknowledges once Bible startup is complete; retries preserve cold launches.
        quickActionDeliveryInFlight = true
        webView.evaluateJavaScript("window.bsbHandleQuickAction?.('\(action)') === true") { [weak self] result, _ in
            guard let self else { return }
            self.quickActionDeliveryInFlight = false
            if result as? Bool == true, self.pendingQuickAction == action {
                self.pendingQuickAction = nil
            }
            if self.pendingQuickAction != nil { self.retryQuickAction() }
        }
    }
}

// Expose only the public APNs environment, never a provider signing credential.
class BSBBridgeViewController: CAPBridgeViewController {
    override func capacitorDidLoad() {
        bridge?.registerPluginInstance(BSBPrintPlugin())
        bridge?.registerPluginInstance(BSBBrowserPlugin())
        bridge?.registerPluginInstance(BSBHapticsPlugin())
    }

    override func webView(with frame: CGRect, configuration: WKWebViewConfiguration) -> WKWebView {
        // Capacitor replaces userContentController after webViewConfiguration().
        // Install on the final controller immediately before creating the web view.
        let environment = Bundle.main.object(forInfoDictionaryKey: "BSBPushEnvironment") as? String == "development"
            ? "development" : "production"
        let pushAvailable = Bundle.main.object(forInfoDictionaryKey: "BSBNativePushAvailable") as? String != "NO"
        configuration.userContentController.addUserScript(WKUserScript(
            source: "window.bsbAPNSEnvironment = '\(environment)'; window.bsbNativePushAvailable = \(pushAvailable);",
            injectionTime: .atDocumentStart, forMainFrameOnly: true))
        return super.webView(with: frame, configuration: configuration)
    }
}

@objc(BSBPrintPlugin)
public class BSBPrintPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BSBPrintPlugin"
    public let jsName = "BSBPrint"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "print", returnType: CAPPluginReturnPromise)
    ]
    private var printing = false

    @objc func print(_ call: CAPPluginCall) {
        DispatchQueue.main.async { [weak self] in
            guard let self, let webView = self.bridge?.webView,
                  webView.window != nil else {
                call.reject("The reader is not ready to print.")
                return
            }
            // Ignore repeated taps while the system print sheet is open.
            guard !self.printing else {
                call.resolve(["completed": false])
                return
            }
            guard UIPrintInteractionController.isPrintingAvailable else {
                call.reject("Printing is unavailable on this device.")
                return
            }
            self.printing = true
            let controller = UIPrintInteractionController.shared
            let info = UIPrintInfo(dictionary: nil)
            info.jobName = "Big Screen Bible"
            info.outputType = .general
            controller.printInfo = info
            // WebKit applies the existing @media print stylesheet, preserving
            // passage selection, layout, verse numbers, and attribution.
            controller.printFormatter = webView.viewPrintFormatter()
            let completion: UIPrintInteractionController.CompletionHandler = { [weak self] _, completed, error in
                self?.printing = false
                controller.printFormatter = nil
                if let error {
                    call.reject("Printing failed.", nil, error)
                } else {
                    call.resolve(["completed": completed])
                }
            }
            let presented: Bool
            if UIDevice.current.userInterfaceIdiom == .pad {
                let anchor = CGRect(x: webView.bounds.midX, y: webView.bounds.midY, width: 1, height: 1)
                presented = controller.present(from: anchor, in: webView, animated: true, completionHandler: completion)
            } else {
                presented = controller.present(animated: true, completionHandler: completion)
            }
            if !presented {
                self.printing = false
                controller.printFormatter = nil
                call.reject("Could not present the print dialog.")
            }
        }
    }
}


@objc(BSBHapticsPlugin)
public class BSBHapticsPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BSBHapticsPlugin"
    public let jsName = "BSBHaptics"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "impact", returnType: CAPPluginReturnPromise)
    ]
    private var softGenerator: UIImpactFeedbackGenerator?
    private var firmGenerator: UIImpactFeedbackGenerator?

    @objc func impact(_ call: CAPPluginCall) {
        let value = call.getDouble("intensity") ?? 0.6
        let intensity = CGFloat(value.isFinite ? min(1, max(0, value)) : 0.6)
        let soft = call.getBool("soft") ?? false
        DispatchQueue.main.async { [weak self] in
            guard let self, UIApplication.shared.applicationState == .active else {
                call.resolve()
                return
            }
            if self.softGenerator == nil {
                self.softGenerator = UIImpactFeedbackGenerator(style: .soft)
                self.firmGenerator = UIImpactFeedbackGenerator(style: .medium)
            }
            let generator = soft ? self.softGenerator : self.firmGenerator
            generator?.impactOccurred(intensity: intensity)
            generator?.prepare()
            call.resolve()
        }
    }
}


// Intercept top-level external web navigation, including target="_blank" links.
@objc(BSBBrowserPlugin)
public class BSBBrowserPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "BSBBrowserPlugin"
    public let jsName = "BSBBrowser"
    public let pluginMethods: [CAPPluginMethod] = []

    public override func shouldOverrideLoad(_ navigationAction: WKNavigationAction) -> NSNumber? {
        guard navigationAction.targetFrame == nil || navigationAction.targetFrame?.isMainFrame == true,
              let url = navigationAction.request.url,
              let scheme = url.scheme?.lowercased(), ["https", "http"].contains(scheme),
              let host = url.host?.lowercased(),
              !["bigscreenbible.com", "www.bigscreenbible.com", "localhost"].contains(host)
        else { return nil }
        DispatchQueue.main.async { [weak self] in
            guard let controller = self?.bridge?.viewController else { return }
            var presenter = controller
            while let presented = presenter.presentedViewController { presenter = presented }
            presenter.present(SFSafariViewController(url: url), animated: true)
        }
        return true
    }
}
