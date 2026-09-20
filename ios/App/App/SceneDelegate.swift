import UIKit
import Capacitor
import WebKit

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
