import UIKit
import UniformTypeIdentifiers
import JavaScriptCore
import WebKit
import SafariServices
import CoreText

// A focused Reader hosted by the share extension, never the containing app.
final class ShareViewController: UIViewController, WKNavigationDelegate {
    private let reader = UIScrollView()
    private let readingStack = UIStackView()
    private let highlightButton = UIButton(type: .system)
    private var verseAnchors: [String: UIView] = [:]
    private var scriptureFont: UIFont = .systemFont(ofSize: 26)
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
    private var baselineVersions: [String: String] = [:]
    private var localChapters: [String: [String: [String: Any]]] = [:]
    private var swatches: [[String: String]] = []
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

    private var accent: UIColor {
        UIColor { $0.userInterfaceStyle == .dark ? UIColor(red: 0.91, green: 0.72, blue: 0.44, alpha: 1) : UIColor(red: 0.59, green: 0.35, blue: 0.12, alpha: 1) }
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .systemBackground
        view.tintColor = accent
        registerScriptureFont()
        let logo = UIImageView(image: UIImage(systemName: "book.pages"))
        let appBundle = Bundle.main.bundleURL.deletingLastPathComponent().deletingLastPathComponent()
        if let image = UIImage(contentsOfFile: appBundle.appendingPathComponent("public/assets/brand-mark.png").path) { logo.image = image }
        logo.contentMode = .scaleAspectFit
        logo.tintColor = accent
        logo.widthAnchor.constraint(equalToConstant: 34).isActive = true
        logo.heightAnchor.constraint(equalToConstant: 34).isActive = true
        let heading = label("Big Screen Bible", style: .headline)
        let subtitle = label("Imported passages", style: .caption1, color: .secondaryLabel)
        let brand = UIStackView(arrangedSubviews: [heading, subtitle])
        brand.axis = .vertical
        brand.spacing = 2
        let done = UIButton(type: .system)
        stylePill(done, title: "", symbol: "xmark")
        done.accessibilityLabel = "Done"
        done.addTarget(self, action: #selector(close), for: .touchUpInside)
        stylePill(versionButton, title: "BSB", symbol: "chevron.down")
        versionButton.configuration?.imagePlacement = .trailing
        versionButton.accessibilityLabel = "Bible translation"
        versionButton.addTarget(self, action: #selector(chooseVersion), for: .touchUpInside)
        versionButton.setContentHuggingPriority(.required, for: .horizontal)
        done.setContentHuggingPriority(.required, for: .horizontal)
        let header = UIStackView(arrangedSubviews: [logo, brand, versionButton, done])
        header.alignment = .center
        header.spacing = 10
        status.text = "Finding passages…"
        status.font = .preferredFont(forTextStyle: .footnote)
        status.adjustsFontForContentSizeCategory = true
        status.numberOfLines = 0
        status.textColor = .secondaryLabel
        status.accessibilityTraits = .updatesFrequently
        reader.alwaysBounceVertical = true
        reader.contentInset.bottom = 28
        readingStack.axis = .vertical
        readingStack.spacing = 24
        readingStack.translatesAutoresizingMaskIntoConstraints = false
        reader.addSubview(readingStack)
        NSLayoutConstraint.activate([
            readingStack.topAnchor.constraint(equalTo: reader.contentLayoutGuide.topAnchor, constant: 28),
            readingStack.bottomAnchor.constraint(equalTo: reader.contentLayoutGuide.bottomAnchor, constant: -24),
            readingStack.centerXAnchor.constraint(equalTo: reader.frameLayoutGuide.centerXAnchor),
            readingStack.widthAnchor.constraint(lessThanOrEqualTo: reader.frameLayoutGuide.widthAnchor, constant: -8),
            readingStack.widthAnchor.constraint(lessThanOrEqualToConstant: 720)
        ])
        let preferredWidth = readingStack.widthAnchor.constraint(equalTo: reader.frameLayoutGuide.widthAnchor, constant: -8)
        preferredWidth.priority = .defaultHigh
        preferredWidth.isActive = true
        stylePill(bookmarks, title: "Bookmark all", symbol: "bookmark")
        bookmarks.addTarget(self, action: #selector(bookmarkAll), for: .touchUpInside)
        stylePill(highlightButton, title: "Highlight all", symbol: "highlighter")
        highlightButton.addTarget(self, action: #selector(highlightAll), for: .touchUpInside)
        footer.axis = .vertical
        footer.spacing = 14
        footer.addArrangedSubview(label("Save these passages", style: .headline))
        let actions = UIStackView(arrangedSubviews: [bookmarks, highlightButton])
        actions.axis = .vertical
        actions.spacing = 10
        actions.alignment = .leading
        footer.addArrangedSubview(actions)
        footer.addArrangedSubview(label("Saved changes appear when you next open Big Screen Bible.", style: .footnote, color: .secondaryLabel))
        footer.isHidden = true
        let separator = UIView()
        separator.backgroundColor = .separator
        separator.heightAnchor.constraint(equalToConstant: 0.5).isActive = true
        let stack = UIStackView(arrangedSubviews: [header, status, separator, reader])
        stack.axis = .vertical
        stack.spacing = 12
        stack.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(stack)
        NSLayoutConstraint.activate([
            stack.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 18),
            stack.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: 20),
            stack.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -20),
            stack.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor)
        ])
        preferredContentSize = CGSize(width: 600, height: 820)
        loadText()
    }

    override func traitCollectionDidChange(_ previousTraitCollection: UITraitCollection?) {
        super.traitCollectionDidChange(previousTraitCollection)
        if let previousTraitCollection,
           previousTraitCollection.preferredContentSizeCategory != traitCollection.preferredContentSizeCategory
            || previousTraitCollection.hasDifferentColorAppearance(comparedTo: traitCollection) { renderReader() }
    }

    private func registerScriptureFont() {
        let appBundle = Bundle.main.bundleURL.deletingLastPathComponent().deletingLastPathComponent()
        let url = appBundle.appendingPathComponent("public/assets/fonts/literata-400.ttf")
        if FileManager.default.fileExists(atPath: url.path) {
            CTFontManagerRegisterFontsForURL(url as CFURL, .process, nil)
            if let descriptors = CTFontManagerCreateFontDescriptorsFromURL(url as CFURL) as? [CTFontDescriptor],
               let descriptor = descriptors.first,
               let name = CTFontDescriptorCopyAttribute(descriptor, kCTFontNameAttribute) as? String,
               let font = UIFont(name: name, size: 26) { scriptureFont = font; return }
        }
        scriptureFont = UIFont(name: "Georgia", size: 26) ?? .systemFont(ofSize: 26)
    }

    private func label(_ text: String, style: UIFont.TextStyle, color: UIColor = .label) -> UILabel {
        let label = UILabel()
        label.text = text
        label.font = .preferredFont(forTextStyle: style)
        label.adjustsFontForContentSizeCategory = true
        label.textColor = color
        label.numberOfLines = 0
        return label
    }

    private func stylePill(_ button: UIButton, title: String, symbol: String) {
        var config = UIButton.Configuration.bordered()
        config.title = title
        config.image = UIImage(systemName: symbol)
        config.imagePadding = 8
        config.cornerStyle = .capsule
        config.baseForegroundColor = .label
        config.background.backgroundColor = .secondarySystemBackground
        config.background.strokeColor = .separator
        config.background.strokeWidth = 0.5
        config.contentInsets = NSDirectionalEdgeInsets(top: 11, leading: 14, bottom: 11, trailing: 14)
        config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { attributes in
            var result = attributes
            result.font = UIFont.preferredFont(forTextStyle: .subheadline).withTraits(.traitBold)
            return result
        }
        config.imageColorTransformer = UIConfigurationColorTransformer { [weak self] _ in self?.accent ?? .systemBrown }
        button.configuration = config
        button.heightAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true
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
        engine.setObject(["aliases": catalog["aliases"] ?? [:], "chapters": catalog["validation"] ?? catalog["chapters"] ?? [:]], forKeyedSubscript: "importCatalog" as NSString)
        engine.setObject(text, forKeyedSubscript: "sharedDevotionalText" as NSString)
        let result = engine.evaluateScript("BSBPassageImport.extract(sharedDevotionalText, importCatalog.aliases, importCatalog.chapters)")
        guard engine.exception == nil, let matches = result?.toArray() as? [[String: Any]],
              let chapters = catalog["chapters"] as? [String: [String: Any]] else {
            status.text = "This text has too many passages. Share a smaller section and try again."
            return
        }
        let bundled = catalog["bundled"] as? [String: [String: [String: Any]]] ?? [:]
        swatches = catalog["highlights"] as? [[String: String]] ?? []
        for item in matches {
            guard let ref = item["ref"] as? String, let key = item["key"] as? String else { continue }
            if let error = item["error"] as? String, !error.isEmpty { issues.append("\(ref): \(error)"); continue }
            let numbers = Set(item["verses"] as? [Int] ?? [])
            for (code, chapters) in bundled { localChapters[code, default: [:]][key] = chapters[key] }
            var fallback = "BSB"
            var source = chapters[key]?["verses"] as? [[String: Any]] ?? []
            if !numbers.isSubset(of: Set(source.compactMap { $0["n"] as? Int })) {
                fallback = "KJV"
                source = bundled["KJV"]?[key]?["verses"] as? [[String: Any]] ?? []
            }
            let verses = source.compactMap { verse -> (ref: String, text: String)? in
                guard let n = verse["n"] as? Int, numbers.contains(n), let text = verse["text"] as? String else { return nil }
                return ("\(key):\(n)", text)
            }
            if verses.count == numbers.count && !verses.isEmpty {
                passages.append((ref, verses))
                if fallback != "BSB" { baselineVersions[ref] = fallback }
            } else { issues.append("\(ref): This complete passage is unavailable in the offline Bibles.") }
        }
        guard !passages.isEmpty else {
            status.text = issues.isEmpty ? "No Bible references found. Share the devotional text itself; a webpage link does not contain its text." : issues.joined(separator: "\n")
            return
        }
        online = catalog["online"] as? [String: Any] ?? [:]
        versions = online["translations"] as? [[String: Any]] ?? []
        baseline = passages
        restoreAnnotations()
        status.text = "Tap a verse for tools."
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
        bookmarks.configuration?.title = Set(passages.map { $0.ref }).isSubset(of: bookmarked) ? "All bookmarked" : "Bookmark all"
    }

    private func renderReader() {
        guard isViewLoaded else { return }
        if presentedViewController is ShareVersePalette { dismiss(animated: false) }
        let offset = reader.contentOffset
        readingStack.arrangedSubviews.forEach { readingStack.removeArrangedSubview($0); $0.removeFromSuperview() }
        verseAnchors.removeAll()
        let paragraph = NSMutableParagraphStyle()
        paragraph.lineSpacing = 6
        let font = UIFontMetrics(forTextStyle: .title2).scaledFont(for: scriptureFont)
        for (index, passage) in passages.enumerated() {
            let section = UIStackView()
            section.axis = .vertical
            section.spacing = 20
            let heading = label("\(passage.ref) (\(displayCode(displayedVersions[passage.ref] ?? "BSB")))", style: .title2)
            heading.font = UIFontMetrics(forTextStyle: .title2).scaledFont(for: UIFont(name: "Georgia-Italic", size: 23) ?? scriptureFont.withSize(23))
            section.addArrangedSubview(heading)
            if let notice = notices[passage.ref] { section.addArrangedSubview(label(notice, style: .footnote, color: .secondaryLabel)) }
            for verse in passage.verses {
                let number = UIButton(type: .system)
                number.setTitle(String(verse.ref.split(separator: ":").last ?? ""), for: .normal)
                number.titleLabel?.font = .preferredFont(forTextStyle: .caption1)
                number.setTitleColor(.secondaryLabel, for: .normal)
                number.widthAnchor.constraint(equalToConstant: 32).isActive = true
                number.heightAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true
                number.accessibilityLabel = "Tools for \(verse.ref)"
                let body = UILabel()
                body.numberOfLines = 0
                body.adjustsFontForContentSizeCategory = true
                var attributes: [NSAttributedString.Key: Any] = [.font: font, .foregroundColor: UIColor.label, .paragraphStyle: paragraph]
                // Only actual Scripture glyphs receive color: no number, padding or trailing newline.
                if let color = highlights[verse.ref] {
                    attributes[.backgroundColor] = highlightColor(color)
                    attributes[.foregroundColor] = UIColor.black
                }
                body.attributedText = NSAttributedString(string: verse.text, attributes: attributes)
                body.isUserInteractionEnabled = true
                body.accessibilityTraits = [.staticText, .button]
                body.accessibilityHint = "Opens highlights, bookmark, note, and copy tools"
                let open: () -> Void = { [weak self, weak number] in
                    guard let self, let number else { return }
                    self.verseTools(verse.ref, passageIndex: index, anchor: number)
                }
                number.addAction(UIAction { _ in open() }, for: .touchUpInside)
                let tap = ShareVerseTap(open)
                body.addGestureRecognizer(tap)
                body.accessibilityCustomActions = [UIAccessibilityCustomAction(name: "Verse tools", actionHandler: { _ in open(); return true })]
                let row = UIStackView(arrangedSubviews: [number, body])
                row.alignment = .top
                row.spacing = 6
                section.addArrangedSubview(row)
                verseAnchors[verse.ref] = number
                if notes[verse.ref] != nil || bookmarked.contains(verse.ref) {
                    let annotation = UIButton(type: .system)
                    let title = [bookmarked.contains(verse.ref) ? "Bookmarked" : nil, notes[verse.ref] != nil ? "View note" : nil].compactMap { $0 }.joined(separator: " · ")
                    var config = UIButton.Configuration.plain()
                    config.title = title
                    config.image = UIImage(systemName: notes[verse.ref] != nil ? "note.text" : "bookmark.fill")
                    config.imagePadding = 6
                    config.baseForegroundColor = .secondaryLabel
                    annotation.configuration = config
                    annotation.contentHorizontalAlignment = .leading
                    annotation.addAction(UIAction { [weak self, weak number] _ in
                        guard let self, let number else { return }
                        if self.notes[verse.ref] != nil { self.editNote(verse.ref) }
                        else { self.verseTools(verse.ref, passageIndex: index, anchor: number) }
                    }, for: .touchUpInside)
                    annotation.heightAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true
                    section.addArrangedSubview(annotation)
                }
            }
            readingStack.addArrangedSubview(section)
            let separator = UIView()
            separator.backgroundColor = .separator
            separator.heightAnchor.constraint(equalToConstant: 0.5).isActive = true
            readingStack.addArrangedSubview(separator)
        }
        if !issues.isEmpty { readingStack.addArrangedSubview(label("References needing correction\n" + issues.joined(separator: "\n"), style: .footnote, color: .secondaryLabel)) }
        if !passages.isEmpty { readingStack.addArrangedSubview(footer) }
        for (version, copyright) in copyrights.sorted(by: { $0.key < $1.key }) {
            let attribution = UIStackView()
            attribution.axis = .vertical
            attribution.spacing = 8
            attribution.addArrangedSubview(label("\(displayCode(version)) · \(copyright)", style: .footnote, color: .secondaryLabel))
            for (title, url) in publisherLinks(version) {
                let link = UIButton(type: .system)
                link.setTitle(title, for: .normal)
                link.titleLabel?.font = .preferredFont(forTextStyle: .footnote)
                link.contentHorizontalAlignment = .leading
                link.heightAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true
                link.addAction(UIAction { [weak self] _ in self?.present(SFSafariViewController(url: url), animated: true) }, for: .touchUpInside)
                attribution.addArrangedSubview(link)
            }
            readingStack.addArrangedSubview(attribution)
        }
        view.layoutIfNeeded()
        reader.setContentOffset(CGPoint(x: 0, y: min(offset.y, max(0, reader.contentSize.height - reader.bounds.height))), animated: false)
    }

    private var allRefs: [String] { Array(Set(passages.flatMap { $0.verses.map { $0.ref } })).sorted() }

    private func verseTools(_ ref: String, passageIndex: Int, anchor: UIView) {
        showPalette(title: ref, refs: [ref], anchor: anchor, passageIndex: passageIndex)
    }

    @objc private func bookmarkAll() { save(kind: "bookmarks", refs: passages.map { $0.ref }) }
    @objc private func highlightAll() { showPalette(title: "Highlight all", refs: allRefs, anchor: highlightButton) }

    private func showPalette(title: String, refs: [String], anchor: UIView, passageIndex: Int? = nil) {
        guard presentedViewController == nil else { return }
        let palette = ShareVersePalette()
        palette.heading = title
        palette.accent = accent
        palette.swatches = swatches
        let legacy = ["#fde68a": "yellow", "#bfdbfe": "blue", "#fbcfe8": "pink", "#bbf7d0": "green", "#ddd6fe": "purple"]
        let selected = refs.count == 1 ? highlights[refs[0]] : nil
        palette.selectedColor = selected.map { legacy[$0] ?? $0 }
        palette.isBookmarked = refs.count == 1 && bookmarked.contains(refs[0])
        palette.hasVerseActions = passageIndex != nil
        palette.onColor = { [weak self, weak palette] color in
            palette?.dismiss(animated: true) { self?.save(kind: "highlights", refs: refs, value: color) }
        }
        palette.onAction = { [weak self, weak palette] action in
            palette?.dismiss(animated: true) {
                guard let self, let index = passageIndex, self.passages.indices.contains(index), let ref = refs.first else { return }
                if action == "bookmark" { self.save(kind: "bookmarks", refs: refs) }
                if action == "note" { self.editNote(ref) }
                if action == "copy", let verse = self.passages[index].verses.first(where: { $0.ref == ref }) {
                    let version = self.displayCode(self.displayedVersions[self.passages[index].ref] ?? "BSB")
                    UIPasteboard.general.string = "\(verse.text) — \(ref) (\(version))"
                    self.status.text = "Copied \(ref) (\(version))."
                    UIAccessibility.post(notification: .announcement, argument: "Verse copied")
                }
            }
        }
        presentTools(palette, anchor: anchor, width: min(360, view.bounds.width - 32))
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

    private func presentTools(_ controller: ShareToolsController, anchor: UIView, width: CGFloat) {
        controller.modalPresentationStyle = .popover
        controller.overrideUserInterfaceStyle = traitCollection.userInterfaceStyle
        controller.maximumHeight = min(540, max(180, view.bounds.height - 100))
        let popover = controller.popoverPresentationController
        popover?.backgroundColor = .secondarySystemBackground
        popover?.sourceView = anchor
        popover?.sourceRect = anchor.bounds
        popover?.permittedArrowDirections = [.up, .down]
        popover?.delegate = controller
        controller.sizeForPresentation(width: width)
        present(controller, animated: true)
    }

    @objc private func chooseVersion() {
        guard presentedViewController == nil else { return }
        let picker = ShareVersionPicker()
        picker.accent = accent
        picker.selectedVersion = selectedVersion
        let preferred = store?.dictionary(forKey: "bsbShareReaderSnapshot")?["versions"] as? [String] ?? []
        picker.versions = versions.sorted { a, b in
            let aRank = preferred.firstIndex(of: a["code"] as? String ?? "") ?? 100
            let bRank = preferred.firstIndex(of: b["code"] as? String ?? "") ?? 100
            return aRank == bRank ? (a["code"] as? String ?? "") < (b["code"] as? String ?? "") : aRank < bRank
        }
        picker.onSelect = { [weak self, weak picker] code in
            picker?.dismiss(animated: true) { self?.selectVersion(code) }
        }
        presentTools(picker, anchor: versionButton, width: min(360, view.bounds.width - 32))
    }

    private func selectVersion(_ requested: String) {
        onlineTask?.cancel()
        generation = UUID()
        let version = versions.first(where: { $0["code"] as? String == requested })
        selectedVersion = version == nil ? "BSB" : requested
        versionButton.configuration?.title = displayCode(selectedVersion)
        passages = baseline
        displayedVersions = baselineVersions
        notices.removeAll()
        copyrights.removeAll()
        loading = false
        if version == nil && requested != "BSB" {
            for passage in passages { notices[passage.ref] = "\(requested) is available in the full app. Showing BSB here." }
        }
        if selectedVersion == "KJV" {
            let chapters = localChapters["KJV"] ?? [:]
            for (chapter, source) in chapters {
                let payload: [String: Any] = ["version": "KJV", "verses": source["verses"] ?? []]
                applyOnlineChapter(chapter, data: try? JSONSerialization.data(withJSONObject: payload), code: "KJV", needsTracking: false)
            }
            status.text = notices.isEmpty ? "KJV · Available offline. Tap a verse for tools." : "Some passages are unavailable in KJV. Their offline fallback is labeled."
            return
        }
        if selectedVersion == "BSB" {
            for passage in passages where baselineVersions[passage.ref] != nil { notices[passage.ref] = "This complete passage is unavailable in BSB. Showing KJV instead." }
        }
        guard selectedVersion != "BSB", let version,
              let endpoint = version["endpoint"] as? String,
              let base = online["url"] as? String, let key = online["anonKey"] as? String,
              let baseURL = URL(string: base), baseURL.scheme == "https", baseURL.host == "yyldnatfhzobyeqnvqjv.supabase.co" else {
            status.text = "Tap a verse for tools."
            renderReader()
            return
        }
        loading = true
        status.text = "Loading \(displayCode(selectedVersion))… Offline text is available while you wait."
        for passage in passages { notices[passage.ref] = "Loading \(displayCode(selectedVersion))… showing offline text for now." }
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
            self.status.text = failures == 0 ? "Tap a verse for tools." : "\(self.displayCode(code)) unavailable for \(failures) \(failures == 1 ? "passage" : "passages"). Offline text is shown instead. Choose a version to retry."
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
                notices[source.ref] = "\(displayCode(code)) could not load this complete passage. Showing \(displayCode(displayedVersions[source.ref] ?? "BSB")) instead."
            }
        }
        if displayed {
            if code != "KJV" { copyrights[code] = payload?["copyright"] as? String ?? (code == "ESV" ? "ESV® Bible © 2001 by Crossway. Used by permission. All rights reserved." : "") }
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

    private func highlightColor(_ value: String) -> UIColor {
        // Legacy pastel values are rendered with their matching standard swatch.
        let legacy = ["#fde68a": "yellow", "#bfdbfe": "blue", "#fbcfe8": "pink", "#bbf7d0": "green", "#ddd6fe": "purple"]
        let name = legacy[value] ?? value
        let hex = swatches.first(where: { $0["value"] == name })?["hex"] ?? value
        let rgb = UInt32(hex.dropFirst(), radix: 16) ?? 0xfff740
        return UIColor(red: CGFloat((rgb >> 16) & 255) / 255, green: CGFloat((rgb >> 8) & 255) / 255, blue: CGFloat(rgb & 255) / 255, alpha: 1)
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

private extension UIFont {
    func withTraits(_ traits: UIFontDescriptor.SymbolicTraits) -> UIFont {
        guard let descriptor = fontDescriptor.withSymbolicTraits(fontDescriptor.symbolicTraits.union(traits)) else { return self }
        return UIFont(descriptor: descriptor, size: pointSize)
    }
}

private final class ShareVerseTap: UITapGestureRecognizer {
    private let perform: () -> Void
    init(_ perform: @escaping () -> Void) {
        self.perform = perform
        super.init(target: nil, action: nil)
        addTarget(self, action: #selector(run))
    }
    @objc private func run() { perform() }
}


// Size real presented content, including the popover's arrow safe area. Scroll
// when the system gives us less room rather than clipping controls at the edges.
private class ShareToolsController: UIViewController, UIPopoverPresentationControllerDelegate {
    let contentStack = UIStackView()
    let scroll = UIScrollView()
    var maximumHeight: CGFloat = 600
    var accent: UIColor = .systemBrown
    private let padding: CGFloat = 20

    override func viewDidLoad() {
        super.viewDidLoad()
        view.backgroundColor = .secondarySystemBackground
        view.tintColor = accent
        let surface = UIView()
        surface.backgroundColor = .secondarySystemBackground
        surface.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(surface)
        NSLayoutConstraint.activate([
            surface.leadingAnchor.constraint(equalTo: view.leadingAnchor), surface.trailingAnchor.constraint(equalTo: view.trailingAnchor),
            surface.topAnchor.constraint(equalTo: view.topAnchor), surface.bottomAnchor.constraint(equalTo: view.bottomAnchor)
        ])
        scroll.translatesAutoresizingMaskIntoConstraints = false
        scroll.alwaysBounceVertical = false
        view.addSubview(scroll)
        contentStack.axis = .vertical
        contentStack.spacing = 14
        contentStack.translatesAutoresizingMaskIntoConstraints = false
        scroll.addSubview(contentStack)
        NSLayoutConstraint.activate([
            scroll.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: padding),
            scroll.bottomAnchor.constraint(equalTo: view.safeAreaLayoutGuide.bottomAnchor, constant: -padding),
            scroll.leadingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.leadingAnchor, constant: padding),
            scroll.trailingAnchor.constraint(equalTo: view.safeAreaLayoutGuide.trailingAnchor, constant: -padding),
            contentStack.topAnchor.constraint(equalTo: scroll.contentLayoutGuide.topAnchor),
            contentStack.bottomAnchor.constraint(equalTo: scroll.contentLayoutGuide.bottomAnchor),
            contentStack.leadingAnchor.constraint(equalTo: scroll.contentLayoutGuide.leadingAnchor),
            contentStack.trailingAnchor.constraint(equalTo: scroll.contentLayoutGuide.trailingAnchor),
            contentStack.widthAnchor.constraint(equalTo: scroll.frameLayoutGuide.widthAnchor)
        ])
    }

    func addHeader(_ text: String) {
        let title = UILabel()
        title.text = text
        title.font = .preferredFont(forTextStyle: .subheadline)
        title.adjustsFontForContentSizeCategory = true
        title.numberOfLines = 0
        let close = UIButton(type: .system)
        close.setImage(UIImage(systemName: "xmark"), for: .normal)
        close.tintColor = .secondaryLabel
        close.accessibilityLabel = "Close \(text)"
        close.widthAnchor.constraint(equalToConstant: 44).isActive = true
        close.heightAnchor.constraint(equalToConstant: 44).isActive = true
        close.addAction(UIAction { [weak self] _ in self?.dismiss(animated: true) }, for: .touchUpInside)
        let header = UIStackView(arrangedSubviews: [title, close])
        header.alignment = .center
        header.spacing = 10
        contentStack.addArrangedSubview(header)
    }

    func sizeForPresentation(width: CGFloat) {
        preferredContentSize.width = width
        loadViewIfNeeded()
        let fittingWidth = max(1, width - padding * 2)
        let height = contentStack.systemLayoutSizeFitting(CGSize(width: fittingWidth, height: 0), withHorizontalFittingPriority: .required, verticalFittingPriority: .fittingSizeLevel).height
        preferredContentSize = CGSize(width: width, height: min(maximumHeight, height + padding * 2 + 16))
    }

    override func viewDidLayoutSubviews() {
        super.viewDidLayoutSubviews()
        guard scroll.bounds.width > 0 else { return }
        let height = contentStack.systemLayoutSizeFitting(CGSize(width: scroll.bounds.width, height: 0), withHorizontalFittingPriority: .required, verticalFittingPriority: .fittingSizeLevel).height
        let wanted = min(maximumHeight, height + padding * 2 + view.safeAreaInsets.top + view.safeAreaInsets.bottom)
        if abs(wanted - preferredContentSize.height) > 1 { preferredContentSize.height = wanted }
    }

    func adaptivePresentationStyle(for controller: UIPresentationController) -> UIModalPresentationStyle { .none }
    func adaptivePresentationStyle(for controller: UIPresentationController, traitCollection: UITraitCollection) -> UIModalPresentationStyle { .none }
}

private final class ShareVersePalette: ShareToolsController {
    var heading = ""
    var swatches: [[String: String]] = []
    var selectedColor: String?
    var isBookmarked = false
    var hasVerseActions = true
    var onColor: ((String) -> Void)?
    var onAction: ((String) -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        addHeader(heading)
        // Six circles in site order; wrap on narrow phones to retain 44-point targets.
        let columns = preferredContentSize.width >= 344 ? 6 : 3
        for start in stride(from: 0, to: swatches.count, by: columns) {
            let row = UIStackView()
            row.distribution = .fillEqually
            row.spacing = 6
            for swatch in swatches[start..<min(start + columns, swatches.count)] {
                guard let value = swatch["value"], let hex = swatch["hex"], let name = swatch["name"] else { continue }
                let button = UIButton(type: .system)
                let rgb = UInt32(hex.dropFirst(), radix: 16) ?? 0xfff740
                var config = UIButton.Configuration.filled()
                config.baseBackgroundColor = UIColor(red: CGFloat((rgb >> 16) & 255) / 255, green: CGFloat((rgb >> 8) & 255) / 255, blue: CGFloat(rgb & 255) / 255, alpha: 1)
                config.baseForegroundColor = .black
                config.cornerStyle = .capsule
                config.image = selectedColor == value ? UIImage(systemName: "checkmark") : nil
                button.configuration = config
                button.heightAnchor.constraint(equalToConstant: 44).isActive = true
                button.accessibilityLabel = "Highlight \(name.lowercased())"
                if selectedColor == value { button.accessibilityTraits.insert(.selected) }
                button.addAction(UIAction { [weak self] _ in self?.onColor?(value) }, for: .touchUpInside)
                let slot = UIView()
                button.translatesAutoresizingMaskIntoConstraints = false
                slot.addSubview(button)
                NSLayoutConstraint.activate([
                    button.centerXAnchor.constraint(equalTo: slot.centerXAnchor),
                    button.centerYAnchor.constraint(equalTo: slot.centerYAnchor),
                    button.widthAnchor.constraint(equalToConstant: 44),
                    slot.heightAnchor.constraint(equalToConstant: 44),
                    slot.widthAnchor.constraint(greaterThanOrEqualToConstant: 44)
                ])
                row.addArrangedSubview(slot)
            }
            contentStack.addArrangedSubview(row)
        }
        let clear = UIButton(type: .system)
        var config = UIButton.Configuration.plain()
        config.title = "Remove highlight"
        config.image = UIImage(systemName: "eraser")
        config.imagePadding = 8
        config.baseForegroundColor = .secondaryLabel
        clear.configuration = config
        clear.heightAnchor.constraint(greaterThanOrEqualToConstant: 44).isActive = true
        clear.addAction(UIAction { [weak self] _ in self?.onColor?("none") }, for: .touchUpInside)
        contentStack.addArrangedSubview(clear)
        if hasVerseActions {
            let divider = UIView()
            divider.backgroundColor = .separator
            divider.heightAnchor.constraint(equalToConstant: 0.5).isActive = true
            contentStack.addArrangedSubview(divider)
            let row = UIStackView()
            row.distribution = .fillEqually
            row.spacing = 4
            for (title, symbol, action) in [(isBookmarked ? "Saved" : "Bookmark", isBookmarked ? "bookmark.fill" : "bookmark", "bookmark"), ("Note", "square.and.pencil", "note"), ("Copy", "doc.on.doc", "copy")] {
                let button = UIButton(type: .system)
                var config = UIButton.Configuration.plain()
                config.title = title
                config.image = UIImage(systemName: symbol)
                config.imagePlacement = .top
                config.imagePadding = 8
                config.contentInsets = NSDirectionalEdgeInsets(top: 6, leading: 2, bottom: 6, trailing: 2)
                config.baseForegroundColor = .label
                config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { attributes in
                    var result = attributes
                    result.font = UIFont.preferredFont(forTextStyle: .caption1)
                    return result
                }
                button.configuration = config
                button.isEnabled = !(action == "bookmark" && isBookmarked)
                button.heightAnchor.constraint(greaterThanOrEqualToConstant: 56).isActive = true
                button.addAction(UIAction { [weak self] _ in self?.onAction?(action) }, for: .touchUpInside)
                row.addArrangedSubview(button)
            }
            contentStack.addArrangedSubview(row)
        }
    }
}

private final class ShareVersionPicker: ShareToolsController {
    var versions: [[String: Any]] = []
    var selectedVersion = "BSB"
    var onSelect: ((String) -> Void)?

    override func viewDidLoad() {
        super.viewDidLoad()
        addHeader("Bible version")
        contentStack.spacing = 6
        for version in versions {
            guard let code = version["code"] as? String, let name = version["name"] as? String else { continue }
            let offline = ["BSB", "KJV"].contains(code)
            let selected = code == selectedVersion
            let button = UIButton(type: .system)
            var config = UIButton.Configuration.plain()
            config.title = version["displayCode"] as? String ?? code
            config.subtitle = name + (offline ? " · Offline" : "")
            config.titleAlignment = .leading
            config.imagePlacement = .trailing
            config.image = selected ? UIImage(systemName: "checkmark.circle.fill") : nil
            config.baseForegroundColor = .label
            config.background.backgroundColor = selected ? accent.withAlphaComponent(0.12) : .clear
            config.background.cornerRadius = 12
            config.contentInsets = NSDirectionalEdgeInsets(top: 10, leading: 12, bottom: 10, trailing: 12)
            config.titleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { attributes in
                var result = attributes; result.font = UIFont.preferredFont(forTextStyle: .body); return result
            }
            config.subtitleTextAttributesTransformer = UIConfigurationTextAttributesTransformer { attributes in
                var result = attributes
                result.font = UIFont.preferredFont(forTextStyle: .caption1)
                result.foregroundColor = UIColor.secondaryLabel
                return result
            }
            config.subtitleLineBreakMode = .byWordWrapping
            button.configuration = config
            button.contentHorizontalAlignment = .leading
            button.heightAnchor.constraint(greaterThanOrEqualToConstant: 60).isActive = true
            if selected { button.accessibilityTraits.insert(.selected) }
            button.addAction(UIAction { [weak self] _ in self?.onSelect?(code) }, for: .touchUpInside)
            contentStack.addArrangedSubview(button)
        }
    }
}
