import UIKit
import UniformTypeIdentifiers
import JavaScriptCore
import WebKit
import SafariServices

// A focused Reader hosted by the share extension, never the containing app.
final class ShareViewController: UIViewController, UITextViewDelegate, WKNavigationDelegate {
    private let reader = UITextView()
    private let status = UILabel()
    private let footer = UIStackView()
    private let bookmarks = UIButton(type: .system)
    private var passages: [(ref: String, verses: [(ref: String, text: String)])] = []
    private var issues: [String] = []
    private var highlights: [String: String] = [:]
    private var notes: [String: String] = [:]
    private var bookmarked = Set<String>()
    private let store = UserDefaults(suiteName: "group.com.bigscreenbible.app")
    private let versionButton = UIButton(type: .system)
    private var baseline: [(ref: String, verses: [(ref: String, text: String)])] = []
    private var online: [String: Any] = [:]
    private var versions: [[String: Any]] = []
    private var selectedVersion = "BSB"
    private var displayedVersions: [String: String] = [:]
    private var notices: [String: String] = [:]
    private var copyrights: [String: String] = [:]
    private var onlineTask: Task<Void, Never>?
    private var generation = UUID()
    private var tracker: WKWebView?
    private var trackedTokens = Set<String>()
    private var loading = false
    private let inboxKey = "bsbShareReaderInbox"

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        let heading = UILabel()
        heading.text = "Big Screen Bible · Reader"
        heading.font = .preferredFont(forTextStyle: .headline)
        heading.adjustsFontForContentSizeCategory = true
        let done = UIButton(type: .system)
        done.setTitle("Done", for: .normal)
        done.addTarget(self, action: #selector(close), for: .touchUpInside)
        versionButton.setTitle("BSB ▾", for: .normal)
        versionButton.accessibilityLabel = "Bible translation"
        versionButton.addTarget(self, action: #selector(chooseVersion), for: .touchUpInside)
        versionButton.setContentHuggingPriority(.required, for: .horizontal)
        let header = UIStackView(arrangedSubviews: [heading, versionButton, done])
        header.spacing = 12
        done.setContentHuggingPriority(.required, for: .horizontal)
        status.text = "Finding passages…"
        status.font = .preferredFont(forTextStyle: .footnote)
        status.adjustsFontForContentSizeCategory = true
        status.numberOfLines = 0
        status.textColor = .secondaryLabel
        status.accessibilityTraits = .updatesFrequently
        reader.isEditable = false
        reader.delegate = self
        reader.backgroundColor = .systemBackground
        reader.textContainerInset = UIEdgeInsets(top: 20, left: 8, bottom: 24, right: 8)
        reader.adjustsFontForContentSizeCategory = true
        reader.linkTextAttributes = [:]
        reader.accessibilityLabel = "Imported Scripture. Tap a verse for tools."
        bookmarks.setTitle("Bookmark all", for: .normal)
        bookmarks.addTarget(self, action: #selector(bookmarkAll), for: .touchUpInside)
        let highlight = UIButton(type: .system)
        highlight.setTitle("Highlight all", for: .normal)
        highlight.addTarget(self, action: #selector(highlightAll), for: .touchUpInside)
        footer.axis = .vertical
        footer.spacing = 8
        footer.addArrangedSubview(bookmarks)
        footer.addArrangedSubview(highlight)
        let explanation = UILabel()
        explanation.text = "Saved changes appear when you next open Big Screen Bible."
        explanation.font = .preferredFont(forTextStyle: .footnote)
        explanation.textColor = .secondaryLabel
        explanation.numberOfLines = 0
        explanation.adjustsFontForContentSizeCategory = true
        footer.addArrangedSubview(explanation)
        footer.isHidden = true
        reader.addSubview(footer)
        let stack = UIStackView(arrangedSubviews: [header, status, reader])
        stack.axis = .vertical
        stack.spacing = 8
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 12),
            stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 16),
            stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            stack.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -8),
            done.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
            bookmarks.heightAnchor.constraint(greaterThanOrEqualToConstant: 44),
            highlight.heightAnchor.constraint(greaterThanOrEqualToConstant: 44)
        ])
        preferredContentSize = CGSize(width: 600, height: 800)
        loadText()
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        placeFooter()
    }

    private func placeFooter() {
        guard !footer.isHidden else { return }
        // A real scroll-content footer, after the final Scripture, rather than a fixed toolbar.
        let width = max(1, reader.bounds.width - 24)
        let height = footer.systemLayoutSizeFitting(CGSize(width: width, height: 0),
            withHorizontalFittingPriority: .required, verticalFittingPriority: .fittingSizeLevel).height
        reader.layoutManager.ensureLayout(for: reader.textContainer)
        let bottom = reader.layoutManager.usedRect(for: reader.textContainer).maxY + reader.textContainerInset.top + 32
        footer.frame = CGRect(x: 12, y: bottom, width: width, height: height)
        let inset = height + 56
        if reader.textContainerInset.bottom != inset { reader.textContainerInset.bottom = inset }
        reader.contentSize.height = bottom + height + 24
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
            self?.showText(parts.filter { !$0.isEmpty }.joined(separator: "\n\n"))
        }
    }

    private func showText(_ text: String) {
        guard !text.isEmpty, text.utf16.count <= 100000 else {
            status.text = text.isEmpty ? "No text was shared. Share the devotional text itself." : "Please share no more than 100,000 characters."
            return
        }
        guard let engine = JSContext(),
              let parserURL = Bundle.main.url(forResource: "passage-import", withExtension: "js"),
              let catalogURL = Bundle.main.url(forResource: "passage-import-catalog", withExtension: "json"),
              let parser = try? String(contentsOf: parserURL, encoding: .utf8),
              let data = try? Data(contentsOf: catalogURL),
              let catalog = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            status.text = "Scripture could not load. Please try again."
            return
        }
        engine.evaluateScript(parser)
        engine.setObject(catalog, forKeyedSubscript: "importCatalog" as NSString)
        engine.setObject(text, forKeyedSubscript: "sharedDevotionalText" as NSString)
        let result = engine.evaluateScript("BSBPassageImport.extract(sharedDevotionalText, importCatalog.aliases, importCatalog.chapters)")
        guard engine.exception == nil, let matches = result?.toArray() as? [[String: Any]],
              let chapters = catalog["chapters"] as? [String: [String: Any]] else {
            status.text = "This text has too many passages. Share a smaller section and try again."
            return
        }
        for item in matches {
            guard let ref = item["ref"] as? String, let key = item["key"] as? String else { continue }
            if let error = item["error"] as? String, !error.isEmpty { issues.append("\(ref): \(error)"); continue }
            let numbers = Set(item["verses"] as? [Int] ?? [])
            let verses = (chapters[key]?["verses"] as? [[String: Any]] ?? []).compactMap { verse -> (ref: String, text: String)? in
                guard let n = verse["n"] as? Int, numbers.contains(n), let text = verse["text"] as? String else { return nil }
                return ("\(key):\(n)", text)
            }
            if !verses.isEmpty { passages.append((ref, verses)) }
        }
        guard !passages.isEmpty else {
            status.text = issues.isEmpty ? "No Bible references found. Share the devotional text itself; a webpage link does not contain its text." : issues.joined(separator: "\n")
            return
        }
        online = catalog["online"] as? [String: Any] ?? [:]
        versions = online["translations"] as? [[String: Any]] ?? []
        baseline = passages
        restoreAnnotations()
        status.text = "BSB · Tap a verse for highlights, bookmarks, and notes."
        footer.isHidden = false
        renderReader()
        let preferred = (store?.dictionary(forKey: "bsbShareReaderSnapshot")?["versions"] as? [String])?.first ?? "BSB"
        selectVersion(preferred)
    }

    private func restoreAnnotations() {
        let snapshot = store?.dictionary(forKey: "bsbShareReaderSnapshot") ?? [:]
        highlights = snapshot["highlights"] as? [String: String] ?? [:]
        notes = snapshot["notes"] as? [String: String] ?? [:]
        bookmarked = Set(snapshot["bookmarks"] as? [String] ?? [])
        for item in store?.array(forKey: inboxKey) as? [[String: String]] ?? [] {
            guard let text = item["text"], let data = text.data(using: .utf8),
                  let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let kind = payload["kind"] as? String, let refs = payload["refs"] as? [String],
                  let value = payload["value"] as? String else { continue }
            if kind == "bookmarks" { bookmarked.formUnion(refs) }
            if kind == "highlights" { for ref in refs { highlights[ref] = value == "none" ? nil : value } }
            if kind == "notes", let ref = refs.first { notes[ref] = value.isEmpty ? nil : value }
        }
        updateBookmarkButton()
    }

    private func updateBookmarkButton() {
        bookmarks.setTitle(Set(passages.map { $0.ref }).isSubset(of: bookmarked) ? "All bookmarked" : "Bookmark all", for: .normal)
    }

    private func renderReader() {
        let offset = reader.contentOffset
        let output = NSMutableAttributedString(string: "")
        let paragraph = NSMutableParagraphStyle()
        paragraph.lineSpacing = 8
        paragraph.paragraphSpacing = 20
        let font = UIFontMetrics(forTextStyle: .title2).scaledFont(for: UIFont(name: "Georgia", size: 25) ?? .systemFont(ofSize: 25))
        for (passageIndex, passage) in passages.enumerated() {
            output.append(NSAttributedString(string: "\(passage.ref) (\(displayCode(displayedVersions[passage.ref] ?? "BSB")))\n\n", attributes: [
                .font: UIFontMetrics(forTextStyle: .headline).scaledFont(for: UIFont(name: "Georgia-Italic", size: 22) ?? .italicSystemFont(ofSize: 22)),
                .foregroundColor: UIColor.label]))
            if let notice = notices[passage.ref] {
                output.append(NSAttributedString(string: notice + "\n\n", attributes: [.font: UIFont.preferredFont(forTextStyle: .footnote), .foregroundColor: UIColor.secondaryLabel]))
            }
            for verse in passage.verses {
                let marked = notes[verse.ref] == nil ? "" : "  ✎"
                var attributes: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: UIColor.label,
                    .paragraphStyle: paragraph, .link: URL(string: "bsbverse://tools/" + verse.ref.addingPercentEncoding(withAllowedCharacters: .urlPathAllowed)! + "?passage=\(passageIndex)")!]
                if let color = highlights[verse.ref] { attributes[.backgroundColor] = highlightColor(color) }
                output.append(NSAttributedString(string: "\(verse.ref.split(separator: ":").last ?? "")  \(verse.text)\(marked)\n\n", attributes: attributes))
            }
        }
        for (version, copyright) in copyrights.sorted(by: { $0.key < $1.key }) {
            output.append(NSAttributedString(string: "\n\(displayCode(version)) · \(copyright)\n", attributes: [.font: UIFont.preferredFont(forTextStyle: .footnote), .foregroundColor: UIColor.secondaryLabel]))
            for (label, url) in publisherLinks(version) {
                output.append(NSAttributedString(string: label + "\n", attributes: [.font: UIFont.preferredFont(forTextStyle: .footnote), .link: url]))
            }
        }
        if !issues.isEmpty {
            output.append(NSAttributedString(string: "References needing correction\n" + issues.joined(separator: "\n"), attributes: [.font: UIFont.preferredFont(forTextStyle: .body), .foregroundColor: UIColor.secondaryLabel]))
        }
        reader.attributedText = output
        placeFooter()
        reader.setContentOffset(offset, animated: false)
    }

    func textView(_ textView: UITextView, shouldInteractWith URL: URL, in characterRange: NSRange, interaction: UITextItemInteraction) -> Bool {
        if URL.scheme == "https" {
            present(SFSafariViewController(url: URL), animated: true)
            return false
        }
        guard URL.scheme == "bsbverse", let ref = String(URL.path.dropFirst()).removingPercentEncoding else { return false }
        let index = URLComponents(url: URL, resolvingAgainstBaseURL: false)?.queryItems?.first(where: { $0.name == "passage" })?.value.flatMap(Int.init)
        verseTools(ref, passageIndex: index)
        return false
    }

    private var allRefs: [String] { Array(Set(passages.flatMap { $0.verses.map { $0.ref } })).sorted() }

    private func sheet(_ title: String, anchor: UIView? = nil) -> UIAlertController {
        let sheet = UIAlertController(title: title, message: nil, preferredStyle: .actionSheet)
        sheet.addAction(UIAlertAction(title: "Cancel", style: .cancel))
        sheet.popoverPresentationController?.sourceView = anchor ?? reader
        sheet.popoverPresentationController?.sourceRect = (anchor ?? reader).bounds
        return sheet
    }

    private func verseTools(_ ref: String, passageIndex: Int?) {
        let menu = sheet(ref)
        menu.addAction(UIAlertAction(title: "Bookmark verse", style: .default) { [weak self] _ in self?.save(kind: "bookmarks", refs: [ref]) })
        menu.addAction(UIAlertAction(title: "Highlight", style: .default) { [weak self] _ in self?.chooseHighlight([ref]) })
        menu.addAction(UIAlertAction(title: "Add or edit note", style: .default) { [weak self] _ in self?.editNote(ref) })
        menu.addAction(UIAlertAction(title: "Copy verse", style: .default) { [weak self] _ in
            guard let self, let passageIndex, self.passages.indices.contains(passageIndex) else { return }
            let passage = self.passages[passageIndex]
            guard let verse = passage.verses.first(where: { $0.ref == ref }) else { return }
            let version = self.displayedVersions[passage.ref] ?? "BSB"
            UIPasteboard.general.string = "\(verse.text) — \(ref) (\(self.displayCode(version)))"
        })
        present(menu, animated: true)
    }

    @objc private func bookmarkAll() { save(kind: "bookmarks", refs: passages.map { $0.ref }) }
    @objc private func highlightAll() { chooseHighlight(allRefs) }

    private func chooseHighlight(_ refs: [String]) {
        let menu = sheet(refs.count == 1 ? "Highlight verse" : "Highlight all")
        for (name, color) in [("Yellow", "#fde68a"), ("Green", "#bbf7d0"), ("Blue", "#bfdbfe"), ("Pink", "#fbcfe8"), ("Purple", "#ddd6fe"), ("Remove highlight", "none")] {
            menu.addAction(UIAlertAction(title: name, style: .default) { [weak self] _ in self?.save(kind: "highlights", refs: refs, value: color) })
        }
        present(menu, animated: true)
    }

    private func editNote(_ ref: String) {
        let editor = ShareNoteController()
        editor.title = ref
        editor.initialText = notes[ref] ?? ""
        editor.onSave = { [weak self] text in self?.save(kind: "notes", refs: [ref], value: text) ?? false }
        present(UINavigationController(rootViewController: editor), animated: true)
    }

    @discardableResult private func save(kind: String, refs: [String], value: String = "") -> Bool {
        guard let store else { status.text = "Could not save. Please try again."; return false }
        var queue = store.array(forKey: inboxKey) as? [[String: String]] ?? []
        guard queue.count < 500 else { status.text = "Open Big Screen Bible to sync saved changes before adding more."; return false }
        let payload: [String: Any] = ["kind": kind, "refs": refs, "value": value]
        guard let data = try? JSONSerialization.data(withJSONObject: payload), let text = String(data: data, encoding: .utf8) else { return false }
        queue.append(["id": UUID().uuidString, "text": text])
        store.set(queue, forKey: inboxKey)
        guard let saved = store.array(forKey: inboxKey) as? [[String: String]], saved == queue else {
            status.text = "Could not save. Please try again."; return false
        }
        if kind == "bookmarks" { bookmarked.formUnion(refs) }
        if kind == "highlights" { for ref in refs { highlights[ref] = value == "none" ? nil : value } }
        if kind == "notes" { notes[refs[0]] = value.isEmpty ? nil : value }
        updateBookmarkButton()
        status.text = "Saved · Changes appear when you next open Big Screen Bible."
        renderReader()
        return true
    }

    private func displayCode(_ code: String) -> String {
        versions.first(where: { $0["code"] as? String == code })?["displayCode"] as? String ?? code
    }

    @objc private func chooseVersion() {
        let menu = sheet("Bible translation", anchor: versionButton)
        let preferred = store?.dictionary(forKey: "bsbShareReaderSnapshot")?["versions"] as? [String] ?? []
        let sorted = versions.sorted { a, b in
            let aRank = preferred.firstIndex(of: a["code"] as? String ?? "") ?? 100
            let bRank = preferred.firstIndex(of: b["code"] as? String ?? "") ?? 100
            return aRank == bRank ? (a["code"] as? String ?? "") < (b["code"] as? String ?? "") : aRank < bRank
        }
        for version in sorted {
            guard let code = version["code"] as? String, let name = version["name"] as? String else { continue }
            menu.addAction(UIAlertAction(title: "\(code == selectedVersion ? "✓ " : "")\(displayCode(code)) · \(name)", style: .default) { [weak self] _ in self?.selectVersion(code) })
        }
        present(menu, animated: true)
    }

    private func selectVersion(_ requested: String) {
        onlineTask?.cancel()
        generation = UUID()
        let version = versions.first(where: { $0["code"] as? String == requested })
        selectedVersion = version == nil ? "BSB" : requested
        versionButton.setTitle("\(displayCode(selectedVersion)) ▾", for: .normal)
        passages = baseline
        displayedVersions.removeAll()
        notices.removeAll()
        copyrights.removeAll()
        loading = false
        if version == nil && requested != "BSB" {
            for passage in passages { notices[passage.ref] = "\(requested) is available in the full app. Showing BSB here." }
        }
        guard selectedVersion != "BSB", let version,
              let endpoint = version["endpoint"] as? String,
              let base = online["url"] as? String, let key = online["anonKey"] as? String,
              let baseURL = URL(string: base), baseURL.scheme == "https", baseURL.host == "yyldnatfhzobyeqnvqjv.supabase.co" else {
            status.text = "BSB · Tap a verse for highlights, bookmarks, and notes."
            renderReader()
            return
        }
        loading = true
        status.text = "Loading \(displayCode(selectedVersion))… BSB is available while you wait."
        for passage in passages { notices[passage.ref] = "Loading \(displayCode(selectedVersion))… showing BSB for now." }
        renderReader()
        let requestID = generation
        let code = selectedVersion
        let chapters = Array(Set(baseline.compactMap { $0.verses.first?.ref.components(separatedBy: ":").first })).sorted()
        let needsTracking = version["tracksFums"] as? Bool == true
        onlineTask = Task { @MainActor [weak self] in
            // Two requests at a time; responses are kept only for this share session.
            await withTaskGroup(of: (String, Data?).self) { group in
                var iterator = chapters.makeIterator()
                func enqueue(_ chapter: String) {
                    group.addTask {
                        var components = URLComponents(url: baseURL.appendingPathComponent("functions/v1/" + endpoint), resolvingAgainstBaseURL: false)!
                        components.queryItems = [URLQueryItem(name: "ref", value: chapter), URLQueryItem(name: "version", value: code)]
                        guard let url = components.url, !Task.isCancelled else { return (chapter, nil) }
                        var request = URLRequest(url: url, cachePolicy: .reloadIgnoringLocalCacheData, timeoutInterval: 12)
                        request.setValue(key, forHTTPHeaderField: "apikey")
                        // The public publishable key is not a JWT. No account/session token enters the extension.
                        do {
                            let config = URLSessionConfiguration.ephemeral
                            config.urlCache = nil
                            let session = URLSession(configuration: config)
                            defer { session.invalidateAndCancel() }
                            let (data, response) = try await session.data(for: request)
                            guard let http = response as? HTTPURLResponse, http.statusCode == 200, data.count < 2_000_000 else { return (chapter, nil) }
                            return (chapter, data)
                        } catch { return (chapter, nil) }
                    }
                }
                for _ in 0..<2 { if let chapter = iterator.next() { enqueue(chapter) } }
                for await (chapter, data) in group {
                    guard !Task.isCancelled, let self, self.generation == requestID else { group.cancelAll(); return }
                    self.applyOnlineChapter(chapter, data: data, code: code, needsTracking: needsTracking)
                    if let next = iterator.next() { enqueue(next) }
                }
            }
            guard !Task.isCancelled, let self, self.generation == requestID else { return }
            self.loading = false
            let failures = self.notices.count
            self.status.text = failures == 0 ? "\(self.displayCode(code)) · Tap a verse for tools." : "\(self.displayCode(code)) unavailable for \(failures) \(failures == 1 ? "passage" : "passages"). BSB is shown instead. Choose a version to retry."
        }
    }

    private func applyOnlineChapter(_ chapter: String, data: Data?, code: String, needsTracking: Bool) {
        let payload = data.flatMap { try? JSONSerialization.jsonObject(with: $0) as? [String: Any] }
        let validVersion = payload?["version"] as? String == code
        let verses = validVersion ? payload?["verses"] as? [[String: Any]] ?? [] : []
        var texts: [Int: String] = [:]
        for verse in verses {
            if let n = verse["n"] as? Int, let text = verse["text"] as? String, !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty { texts[n] = text }
        }
        var displayed = false
        for index in passages.indices where baseline[index].verses.first?.ref.hasPrefix(chapter + ":") == true {
            let source = baseline[index]
            let translated = source.verses.compactMap { verse -> (ref: String, text: String)? in
                guard let n = Int(verse.ref.components(separatedBy: ":").last ?? ""), let text = texts[n] else { return nil }
                return (verse.ref, text)
            }
            if translated.count == source.verses.count && !translated.isEmpty {
                passages[index] = (source.ref, translated)
                displayedVersions[source.ref] = code
                notices.removeValue(forKey: source.ref)
                displayed = true
            } else {
                notices[source.ref] = "\(displayCode(code)) could not load this complete passage. Showing BSB instead."
            }
        }
        if displayed {
            copyrights[code] = payload?["copyright"] as? String ?? (code == "ESV" ? "ESV® Bible © 2001 by Crossway. Used by permission. All rights reserved." : "")
            if needsTracking, let token = payload?["fumsToken"] as? String, !token.isEmpty { trackView(token) }
        }
        renderReader()
    }

    private func publisherLinks(_ code: String) -> [(String, URL)] {
        let links: [String: (String, String)] = [
            "NLT": ("Tyndale", "https://www.tyndale.com/"), "NKJV": ("Thomas Nelson", "https://www.thomasnelsonbibles.com/"),
            "CEV": ("American Bible Society", "https://www.americanbible.org/"), "ESV": ("ESV (Crossway)", "https://www.esv.org/"),
            "NASB2020": ("The Lockman Foundation", "https://www.lockman.org/"), "AMP": ("The Lockman Foundation", "https://www.lockman.org/"),
            "NIV": ("Biblica", "https://www.biblica.com/"), "NIRV": ("Biblica", "https://www.biblica.com/")]
        var result: [(String, URL)] = []
        if let link = links[code], let url = URL(string: link.1) { result.append((link.0, url)) }
        if ["NLT", "NKJV", "CEV"].contains(code) { result.append(("API.Bible", URL(string: "https://api.bible/")!)) }
        if code == "ESV" { result.append(("Full ESV copyright and copying limits", URL(string: "https://bigscreenbible.com/terms/#bible-rights")!)) }
        return result
    }

    private func trackView(_ token: String) {
        guard trackedTokens.insert(token).inserted else { return }
        if let store {
            var pending = store.stringArray(forKey: "bsbShareFumsInbox") ?? []
            if !pending.contains(token) { pending.append(token); store.set(pending, forKey: "bsbShareFumsInbox") }
        }
        if tracker == nil {
            let config = WKWebViewConfiguration()
            // Dedicated provider storage, with no main-app cookies or sign-in credentials.
            config.websiteDataStore = .default()
            let web = WKWebView(frame: CGRect(x: 0, y: 0, width: 1, height: 1), configuration: config)
            web.navigationDelegate = self
            web.isHidden = true
            view.addSubview(web)
            tracker = web
            web.loadHTMLString("""
            <!doctype html><meta name="referrer" content="no-referrer">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' https://pkg.api.bible; connect-src https://fums.api.bible">
            <script>window.fumsData=[];window.fums=function(){fumsData.push(arguments);};</script>
            <script src="https://pkg.api.bible/fumsV3.min.js" onload="window.bsbFumsReady=true"></script>
            """, baseURL: URL(string: "https://bigscreenbible.com/"))
        } else if tracker?.isLoading == false { deliverTracking() }
    }

    func webView(_ webView: WKWebView, didFinish navigation: WKNavigation!) { deliverTracking() }

    private func deliverTracking() {
        let pending = store?.stringArray(forKey: "bsbShareFumsInbox") ?? Array(trackedTokens)
        guard !pending.isEmpty else { return }
        tracker?.callAsyncJavaScript("""
        if (!window.bsbFumsReady) return false;
        await window.fums('trackView', tokens);
        return true;
        """, arguments: ["tokens": pending], in: nil, in: .page) { [weak self] result in
            guard case .success(let value) = result, value as? Bool == true, let store = self?.store else { return }
            let latest = store.stringArray(forKey: "bsbShareFumsInbox") ?? []
            store.set(latest.filter { !pending.contains($0) }, forKey: "bsbShareFumsInbox")
        }
    }

    private func highlightColor(_ hex: String) -> UIColor {
        let value = UInt32(hex.dropFirst(), radix: 16) ?? 0xfde68a
        return UIColor(red: CGFloat((value >> 16) & 255) / 255, green: CGFloat((value >> 8) & 255) / 255, blue: CGFloat(value & 255) / 255, alpha: 0.65)
    }

    @objc private func close() {
        onlineTask?.cancel()
        tracker?.stopLoading()
        extensionContext?.completeRequest(returningItems: nil)
    }

    deinit { onlineTask?.cancel() }

}

private final class ShareNoteController: UIViewController {
    let input = UITextView()
    var initialText = ""
    var onSave: ((String) -> Bool)?
    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        input.text = initialText
        input.font = .preferredFont(forTextStyle: .body)
        input.adjustsFontForContentSizeCategory = true
        input.accessibilityLabel = "Verse note"
        input.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(input)
        NSLayoutConstraint.activate([
            input.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
            input.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 16),
            input.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -16),
            input.bottomAnchor.constraint(equalTo: view.keyboardLayoutGuide.topAnchor)
        ])
        navigationItem.leftBarButtonItem = UIBarButtonItem(barButtonSystemItem: .cancel, target: self, action: #selector(cancel))
        navigationItem.rightBarButtonItem = UIBarButtonItem(barButtonSystemItem: .save, target: self, action: #selector(save))
    }
    @objc private func cancel() { dismiss(animated: true) }
    @objc private func save() {
        guard input.text.utf16.count <= 20000 else {
            let alert = UIAlertController(title: "Note too long", message: "Please keep notes to 20,000 characters or fewer.", preferredStyle: .alert)
            alert.addAction(UIAlertAction(title: "OK", style: .default))
            present(alert, animated: true)
            return
        }
        if onSave?(input.text.trimmingCharacters(in: .whitespacesAndNewlines)) == true { dismiss(animated: true) }
    }
}
