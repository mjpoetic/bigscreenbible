import UIKit
import UniformTypeIdentifiers
import JavaScriptCore

// Sharing stays inside the extension. The app reviews passages on its next activation.
final class ShareViewController: UIViewController, UITextViewDelegate {
    private let textView = UITextView()
    private let status = UILabel()
    private let readButton = UIButton(type: .system)
    private let bookmarkButton = UIButton(type: .system)
    private var loaded = false

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        let heading = UILabel()
        heading.text = "Import Bible passages"
        heading.font = .preferredFont(forTextStyle: .title2)
        heading.adjustsFontForContentSizeCategory = true
        status.text = "Loading shared text…"
        status.numberOfLines = 0
        status.font = .preferredFont(forTextStyle: .body)
        textView.delegate = self
        textView.font = .preferredFont(forTextStyle: .body)
        textView.adjustsFontForContentSizeCategory = true
        textView.layer.borderWidth = 1
        textView.layer.borderColor = UIColor.separator.cgColor
        textView.layer.cornerRadius = 10
        textView.accessibilityLabel = "Shared devotional text"
        readButton.setTitle("Read in Big Screen Bible", for: .normal)
        bookmarkButton.setTitle("Save as bookmarks", for: .normal)
        readButton.isEnabled = false
        bookmarkButton.isEnabled = false
        readButton.addTarget(self, action: #selector(readPassages), for: .touchUpInside)
        bookmarkButton.addTarget(self, action: #selector(saveBookmarks), for: .touchUpInside)
        let explanation = UILabel()
        explanation.text = "Your choice takes effect when you next open Big Screen Bible."
        explanation.font = .preferredFont(forTextStyle: .footnote)
        explanation.textColor = .secondaryLabel
        explanation.numberOfLines = 0
        explanation.adjustsFontForContentSizeCategory = true
        let cancel = UIButton(type: .system)
        cancel.setTitle("Cancel", for: .normal)
        cancel.addTarget(self, action: #selector(close), for: .touchUpInside)
        let stack = UIStackView(arrangedSubviews: [heading, status, textView, readButton, bookmarkButton, explanation, cancel])
        stack.axis = .vertical
        stack.spacing = 16
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 20),
            stack.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -20),
            stack.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor, constant: -12),
            textView.heightAnchor.constraint(greaterThanOrEqualToConstant: 100),
            readButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
            bookmarkButton.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
            cancel.heightAnchor.constraint(greaterThanOrEqualToConstant: 44)
        ])
        preferredContentSize = CGSize(width: 560, height: 600)
        loadText()
    }

    private func loadText() {
        let items = extensionContext?.inputItems as? [NSExtensionItem] ?? []
        let providers = items.flatMap { $0.attachments ?? [] }
        let group = DispatchGroup()
        var parts = Array(repeating: "", count: providers.count)
        for (index, provider) in providers.enumerated() {
            let type = provider.hasItemConformingToTypeIdentifier(UTType.plainText.identifier)
                ? UTType.plainText.identifier : UTType.url.identifier
            guard provider.hasItemConformingToTypeIdentifier(type) else { continue }
            group.enter()
            provider.loadItem(forTypeIdentifier: type, options: nil) { value, _ in
                let text = (value as? String) ?? (value as? URL)?.absoluteString ?? (value as? Data).flatMap { String(data: $0, encoding: .utf8) } ?? ""
                DispatchQueue.main.async { parts[index] = text; group.leave() }
            }
        }
        group.notify(queue: .main) { [weak self] in
            guard let self else { return }
            let text = parts.filter { !$0.isEmpty }.joined(separator: "\n\n")
            self.textView.text = text
            self.loaded = true
            if !text.isEmpty, text.utf16.count <= 100000, let references = self.recognizedReferences(text), !references.isEmpty {
                let title = text.components(separatedBy: .newlines).first(where: { !$0.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty }) ?? "Imported passages"
                self.textView.text = String(title.prefix(120)) + "\n\n" + references.joined(separator: "\n")
                self.status.text = "\(references.count) passages found. You can edit or remove references below. Choose whether to read them or save them as bookmarks."
                self.textView.accessibilityLabel = "Recognized Bible references"
                self.readButton.isEnabled = true
                self.bookmarkButton.isEnabled = true
                return
            }
            self.readButton.isEnabled = !text.isEmpty && text.utf16.count <= 100000
            self.bookmarkButton.isEnabled = self.readButton.isEnabled
            self.status.text = text.isEmpty ? "No text was shared. Copy the devotional and use Import from text in the app." : text.utf16.count > 100000 ? "Please share no more than 100,000 characters." : "Choose an action, then open Big Screen Bible to finish importing. A webpage link alone may not contain the devotional text."
        }
    }

    private func recognizedReferences(_ text: String) -> [String]? {
        guard let engine = JSContext(),
              let parserURL = Bundle.main.url(forResource: "passage-import", withExtension: "js"),
              let catalogURL = Bundle.main.url(forResource: "passage-import-catalog", withExtension: "json"),
              let parser = try? String(contentsOf: parserURL, encoding: .utf8),
              let catalog = try? String(contentsOf: catalogURL, encoding: .utf8) else { return nil }
        engine.evaluateScript(parser)
        engine.evaluateScript("var importCatalog = " + catalog + ";")
        engine.setObject(text, forKeyedSubscript: "sharedDevotionalText" as NSString)
        let result = engine.evaluateScript("BSBPassageImport.extract(sharedDevotionalText, importCatalog.aliases, importCatalog.chapters).map(function(item) { return item.ref; })")
        guard engine.exception == nil else { return nil }
        return result?.toArray() as? [String]
    }

    func textViewDidChange(_ textView: UITextView) {
        readButton.isEnabled = loaded && !textView.text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty && textView.text.utf16.count <= 100000
        bookmarkButton.isEnabled = readButton.isEnabled
    }

    @objc private func readPassages() { enqueue(action: "read") }
    @objc private func saveBookmarks() { enqueue(action: "bookmarks") }

    private func enqueue(action: String) {
        let text = textView.text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard loaded, !text.isEmpty, text.utf16.count <= 100000,
              let store = UserDefaults(suiteName: "group.com.bigscreenbible.app") else {
            status.text = "Please provide between 1 and 100,000 characters."
            return
        }
        var queue = store.array(forKey: "bsbSharedTextInbox") as? [[String: String]] ?? []
        guard queue.count < 10 else {
            status.text = "Open Big Screen Bible to review your pending imports before sharing more."
            return
        }
        queue.append(["id": UUID().uuidString, "text": text, "action": action])
        store.set(queue, forKey: "bsbSharedTextInbox")
        extensionContext?.completeRequest(returningItems: nil)
    }

    @objc private func close() {
        extensionContext?.cancelRequest(withError: NSError(domain: NSCocoaErrorDomain, code: NSUserCancelledError))
    }
}
