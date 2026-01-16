function initNotesApp() {
    const STORAGE_KEY = 'portfolio.notes';
    let notes = [];
    let currentNoteId = null;
    let editorVisible = false;

    // Load notes from localStorage
    function loadNotes() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY);
            notes = stored ? JSON.parse(stored) : [];
            if (notes.length === 0) {
                // Create default welcome note (locked and pinned)
                notes.push({
                    id: Date.now(),
                    title: 'Welcome to Notes',
                    content: '# Welcome to Notes\n\nThis is a dynamic markdown note-taking app.\n\n## Features\n- **Bold** and *italic* text\n- [Links](https://example.com)\n- Images\n- Headers (H1-H6)\n\nStart editing to see the live preview!',
                    created: new Date().toISOString(),
                    modified: new Date().toISOString(),
                    locked: true,
                    pinned: true
                });
                saveNotes();
            }
        } catch (e) {
            console.error('Error loading notes:', e);
            notes = [];
        }
    }

    // Save notes to localStorage
    function saveNotes() {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
        } catch (e) {
            console.error('Error saving notes:', e);
        }
    }

    // Get note title from content (first line or first 50 chars)
    function getNoteTitle(content) {
        if (!content) return 'Untitled Note';
        const firstLine = content.split('\n')[0];
        let title = firstLine.replace(/^#+ /, '').trim();
        if (!title) {
            title = content.substring(0, 50).trim();
        }
        return title || 'Untitled Note';
    }

    // Render markdown to HTML
    function renderMarkdown(markdown) {
        try {
            const html = marked.parse(markdown || '');
            return DOMPurify.sanitize(html);
        } catch (e) {
            console.error('Error rendering markdown:', e);
            return '<p>Error rendering markdown</p>';
        }
    }

    // Render notes list in explorer
    function renderNotesList() {
        const explorer = document.querySelector('.notes-explorer');
        if (!explorer) return;

        explorer.innerHTML = '';
        
        // Sort notes: pinned notes first, then by creation date (newest first)
        const sortedNotes = [...notes].sort((a, b) => {
            // Pinned notes always come first
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            
            // For non-pinned notes, sort by creation date (newest first)
            return new Date(b.created) - new Date(a.created);
        });
        
        sortedNotes.forEach(note => {
            const noteItem = document.createElement('div');
            noteItem.className = 'note-item glass';
            noteItem.textContent = note.title;
            noteItem.dataset.noteId = note.id;
            
            if (note.id === currentNoteId) {
                noteItem.classList.add('active');
            }
            
            noteItem.addEventListener('click', () => {
                loadNote(note.id);
            });
            
            explorer.appendChild(noteItem);
        });
    }

    // Load and display a note
    function loadNote(noteId, showEditor = null) {
        const note = notes.find(n => n.id === noteId);
        if (!note) return;

        currentNoteId = noteId;
        
        const noteInput = document.querySelector('.note-input');
        const notePreview = document.querySelector('.note-preview');
        const semiDivider = document.querySelector('.notes-resizable-divider');
        
        if (!noteInput || !notePreview) return;

        // Check if note is locked
        const isLocked = note.locked === true;
        
        // Determine if editor should be shown
        // If showEditor is explicitly set, use that
        // If null, use current editorVisible state for unlocked notes, false for locked
        let shouldShowEditor;
        if (showEditor !== null) {
            shouldShowEditor = showEditor;
            editorVisible = showEditor; // Update state
        } else {
            shouldShowEditor = isLocked ? false : editorVisible;
        }
        
        // For locked notes, only show preview unless explicitly requested
        if (isLocked && !shouldShowEditor) {
            // Hide editor and divider, show only preview
            noteInput.style.display = 'none';
            noteInput.setAttribute('inert', '');
            if (semiDivider) {
                semiDivider.style.display = 'none';
                semiDivider.setAttribute('inert', '');
            }
            
            // Show preview full width
            notePreview.style.flex = '1 1 100%';
            notePreview.innerHTML = renderMarkdown(note.content);
            editorVisible = false;
        } else if (shouldShowEditor) {
            // Show editor and preview
            noteInput.style.display = 'block';
            noteInput.removeAttribute('inert');
            if (semiDivider) {
                semiDivider.style.display = 'block';
                semiDivider.removeAttribute('inert');
            }
            
            // Reset flex to default split view
            noteInput.style.flex = '1 1 50%';
            notePreview.style.flex = '1 1 50%';
            
            // Create or get textarea
            let textarea = noteInput.querySelector('textarea');
            if (!textarea) {
                textarea = document.createElement('textarea');
                textarea.className = 'note-textarea';
                textarea.placeholder = 'Start typing your note in markdown...';
                noteInput.appendChild(textarea);
            }
            
            textarea.value = note.content;
            notePreview.innerHTML = renderMarkdown(note.content);
            
            // Update preview on input (only for unlocked notes)
            if (!isLocked) {
                textarea.removeEventListener('input', handleTextareaInput);
                textarea.addEventListener('input', handleTextareaInput);
                textarea.removeAttribute('readonly');
            } else {
                // Make textarea read-only for locked notes
                textarea.setAttribute('readonly', 'readonly');
            }
            editorVisible = true;
        } else {
            // Show only preview (for unlocked notes when editor is hidden)
            noteInput.style.display = 'none';
            noteInput.setAttribute('inert', '');
            if (semiDivider) {
                semiDivider.style.display = 'none';
                semiDivider.setAttribute('inert', '');
            }
            
            // Show preview full width
            notePreview.style.flex = '1 1 100%';
            notePreview.innerHTML = renderMarkdown(note.content);
            editorVisible = false;
        }
        
        renderNotesList();
    }

    // Handle textarea input
    function handleTextareaInput(e) {
        const textarea = e.target;
        const content = textarea.value;
        
        const note = notes.find(n => n.id === currentNoteId);
        if (note) {
            note.content = content;
            note.title = getNoteTitle(content);
            note.modified = new Date().toISOString();
            saveNotes();
            
            const notePreview = document.querySelector('.note-preview');
            if (notePreview) {
                notePreview.innerHTML = renderMarkdown(content);
            }
            
            renderNotesList();
        }
    }

    // Insert text at cursor position
    function insertAtCursor(textarea, before, after = '') {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const selectedText = text.substring(start, end);
        
        const newText = text.substring(0, start) + before + selectedText + after + text.substring(end);
        textarea.value = newText;
        
        // Set cursor position
        const newCursorPos = start + before.length + selectedText.length + after.length;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
        
        // Trigger input event
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Create new note
    function createNewNote() {
        const newNote = {
            id: Date.now(),
            title: 'New Note',
            content: '# New Note\n\nStart writing...',
            created: new Date().toISOString(),
            modified: new Date().toISOString(),
            locked: false
        };
        
        notes.unshift(newNote);
        saveNotes();
        renderNotesList();
        loadNote(newNote.id, true); // Show editor for new notes
    }

    // Setup UI controls
    function setupControls() {
        // New note button
        const newNoteBtn = document.querySelector('.new-notes-option');
        if (newNoteBtn) {
            newNoteBtn.addEventListener('click', createNewNote);
        }

        // Preview toggle button
        const previewBtn = document.querySelector('.notes-preview-toggle');
        if (previewBtn) {
            previewBtn.addEventListener('click', () => {
                if (currentNoteId) {
                    const note = notes.find(n => n.id === currentNoteId);
                    
                    // Don't allow opening editor for locked notes
                    if (note && !note.locked) {
                        loadNote(currentNoteId, !editorVisible);
                    } else if (note && note.locked) {
                        editorError('This note is locked and cannot be edited');
                    }
                }
            });
        }

        // Text formatting controls
        const textOptions = document.querySelector('.notes-text-options');
        if (textOptions) {
            const buttons = textOptions.querySelectorAll('img');
            
            // Text/Header dropdown button
            if (buttons[0]) {
                buttons[0].addEventListener('click', (e) => {
                    if (editorVisible) showHeaderDropdown(e.target);
                    else editorError('Text formatting requires editor mode');
                });
            }
            
            // Image button
            if (buttons[1]) {
                buttons[1].addEventListener('click', (e) => {
                    if (editorVisible) showImageDropdown(e.target);
                    else editorError('Image insertion requires editor mode');
                });
            }
            
            // Link button
            if (buttons[2]) {
                buttons[2].addEventListener('click', (e) => {
                    if (editorVisible) showLinkDropdown(e.target);
                    else editorError('Link insertion requires editor mode');
                });
            }
        }

        // Window controls
        const minimizeBtn = document.querySelector('.window-option-minimize');
        const maximizeBtn = document.querySelector('.window-option-maximize');
        const closeBtn = document.querySelector('.window-option-close');
        const notesWindow = document.querySelector('.notes-window');
        
        // Minimize - hides the window
        if (minimizeBtn && notesWindow) {
            minimizeBtn.addEventListener('click', () => {
                notesWindow.style.display = 'none';
            });
        }
        
        // Maximize - toggles fullscreen
        if (maximizeBtn && notesWindow) {
            let isMaximized = false;
            let previousStyles = {};
            
            maximizeBtn.addEventListener('click', () => {
                if (!isMaximized) {
                    // Save current styles
                    previousStyles = {
                        width: notesWindow.style.width,
                        height: notesWindow.style.height,
                        top: notesWindow.style.top,
                        left: notesWindow.style.left,
                        transform: notesWindow.style.transform
                    };
                    
                    // Maximize
                    notesWindow.style.width = '100vw';
                    notesWindow.style.height = '100vh';
                    notesWindow.style.top = '0';
                    notesWindow.style.left = '0';
                    notesWindow.style.transform = 'none';
                    isMaximized = true;
                } else {
                    // Restore previous size
                    Object.assign(notesWindow.style, previousStyles);
                    isMaximized = false;
                }
            });
        }
        
        // Close - hides the window
        if (closeBtn && notesWindow) {
            closeBtn.addEventListener('click', () => {
                notesWindow.style.display = 'none';
            });
        }
        
        // Taskbar icon to show notes
        const notesIcon = document.querySelector('.taskbar-icon-1');
        if (notesIcon && notesWindow) {
            notesIcon.addEventListener('click', () => {
                notesWindow.style.display = notesWindow.style.display === 'none' ? 'flex' : 'none';
            });
        }
    }
    
    // Make window draggable by nav bar
    function makeWindowDraggable() {
        const dragHandle = document.querySelector('[data-drag-handle]');
        const notesWindow = document.querySelector('.notes-window');
        
        if (!dragHandle || !notesWindow) return;
        
        let isDragging = false;
        let currentX, currentY, initialX, initialY;
        
        dragHandle.addEventListener('mousedown', (e) => {
            // Don't drag if clicking on buttons or inputs
            if (e.target.closest('button, input, textarea, img, .notes-options')) {
                return;
            }
            
            isDragging = true;
            initialX = e.clientX - (parseInt(notesWindow.style.left) || 0);
            initialY = e.clientY - (parseInt(notesWindow.style.top) || 0);
            
            dragHandle.style.cursor = 'grabbing';
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            currentX = e.clientX - initialX;
            currentY = e.clientY - initialY;
            
            notesWindow.style.left = `${currentX}px`;
            notesWindow.style.top = `${currentY}px`;
            notesWindow.style.transform = 'none';
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                dragHandle.style.cursor = 'grab';
            }
        });
        
        // Set initial cursor
        dragHandle.style.cursor = 'grab';
    }
    
    // Make window resizable from corners
    function makeWindowResizable() {
        const notesWindow = document.querySelector('.notes-window');
        if (!notesWindow) return;
        
        // Create resize handles for all corners
        const corners = ['nw', 'ne', 'sw', 'se'];
        const minWidth = 400;
        const minHeight = 300;
        
        corners.forEach(corner => {
            const handle = document.createElement('div');
            handle.className = `resize-handle resize-${corner}`;
            handle.style.cssText = `
                position: absolute;
                width: 15px;
                height: 15px;
                z-index: 1000;
            `;
            
            // Position handles
            if (corner === 'nw') {
                handle.style.top = '0';
                handle.style.left = '0';
                handle.style.cursor = 'nwse-resize';
            } else if (corner === 'ne') {
                handle.style.top = '0';
                handle.style.right = '0';
                handle.style.cursor = 'nesw-resize';
            } else if (corner === 'sw') {
                handle.style.bottom = '0';
                handle.style.left = '0';
                handle.style.cursor = 'nesw-resize';
            } else if (corner === 'se') {
                handle.style.bottom = '0';
                handle.style.right = '0';
                handle.style.cursor = 'nwse-resize';
            }
            
            notesWindow.appendChild(handle);
            
            let isResizing = false;
            let startX, startY, startWidth, startHeight, startLeft, startTop;
            
            handle.addEventListener('mousedown', (e) => {
                e.preventDefault();
                isResizing = true;
                
                startX = e.clientX;
                startY = e.clientY;
                startWidth = notesWindow.offsetWidth;
                startHeight = notesWindow.offsetHeight;
                startLeft = notesWindow.offsetLeft;
                startTop = notesWindow.offsetTop;
                
                document.addEventListener('mousemove', resize);
                document.addEventListener('mouseup', stopResize);
            });
            
            function resize(e) {
                if (!isResizing) return;
                
                const deltaX = e.clientX - startX;
                const deltaY = e.clientY - startY;
                
                let newWidth = startWidth;
                let newHeight = startHeight;
                let newLeft = startLeft;
                let newTop = startTop;
                
                // Calculate new dimensions based on corner
                if (corner.includes('e')) {
                    newWidth = Math.max(minWidth, startWidth + deltaX);
                } else if (corner.includes('w')) {
                    newWidth = Math.max(minWidth, startWidth - deltaX);
                    if (newWidth > minWidth) newLeft = startLeft + deltaX;
                }
                
                if (corner.includes('s')) {
                    newHeight = Math.max(minHeight, startHeight + deltaY);
                } else if (corner.includes('n')) {
                    newHeight = Math.max(minHeight, startHeight - deltaY);
                    if (newHeight > minHeight) newTop = startTop + deltaY;
                }
                
                notesWindow.style.width = `${newWidth}px`;
                notesWindow.style.height = `${newHeight}px`;
                notesWindow.style.left = `${newLeft}px`;
                notesWindow.style.top = `${newTop}px`;
                notesWindow.style.transform = 'none';
            }
            
            function stopResize() {
                isResizing = false;
                document.removeEventListener('mousemove', resize);
                document.removeEventListener('mouseup', stopResize);
            }
        });
        
        // Set initial position style
        notesWindow.style.position = 'fixed';
    }
    
    // Delete note on DELETE key press
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle DELETE key
            if (e.key !== 'Delete' && e.key !== 'Del') return;
            
            // Check if we're in the notes window and not in an input field
            const notesWindow = document.querySelector('.notes-window');
            if (!notesWindow || notesWindow.style.display === 'none') return;
            
            // Don't delete if user is typing in textarea
            if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
            
            // Don't delete if no note is selected
            if (!currentNoteId) return;
            
            // Get current note
            const note = notes.find(n => n.id === currentNoteId);
            if (!note) return;
            
            // Don't delete locked notes (like the default note)
            if (note.locked) {
                editorError('Cannot delete locked notes');
                return;
            }
            
            // Show confirmation dialog
            showDeleteConfirmation(note);
        });
    }
    
    // Show delete confirmation popup
    function showDeleteConfirmation(note) {
        // Create overlay
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        // Create dialog
        const dialog = document.createElement('div');
        dialog.className = 'glass';
        dialog.style.cssText = `
            padding: 30px;
            border-radius: 12px;
            max-width: 400px;
            background: rgba(255, 255, 255, 0.95);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;
        
        // Title
        const title = document.createElement('h2');
        title.textContent = 'Delete Note?';
        title.style.cssText = `
            margin: 0 0 15px 0;
            font-size: 20px;
            color: #333;
        `;
        
        // Message
        const message = document.createElement('p');
        message.textContent = `Are you sure you want to delete "${note.title}"? This action cannot be undone.`;
        message.style.cssText = `
            margin: 0 0 25px 0;
            color: #666;
            line-height: 1.5;
        `;
        
        // Buttons container
        const buttonsDiv = document.createElement('div');
        buttonsDiv.style.cssText = `
            display: flex;
            gap: 10px;
            justify-content: flex-end;
        `;
        
        // Cancel button
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            background: #e0e0e0;
            color: #333;
            cursor: pointer;
            font-size: 14px;
        `;
        cancelBtn.addEventListener('click', () => overlay.remove());
        
        // Delete button
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.cssText = `
            padding: 10px 20px;
            border: none;
            border-radius: 6px;
            background: #dc3232;
            color: white;
            cursor: pointer;
            font-size: 14px;
        `;
        deleteBtn.addEventListener('click', () => {
            deleteNote(note.id);
            overlay.remove();
        });
        
        // Assemble dialog
        buttonsDiv.appendChild(cancelBtn);
        buttonsDiv.appendChild(deleteBtn);
        dialog.appendChild(title);
        dialog.appendChild(message);
        dialog.appendChild(buttonsDiv);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
        
        // Close on overlay click
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) overlay.remove();
        });
        
        // Close on Escape key
        const escHandler = (e) => {
            if (e.key === 'Escape') {
                overlay.remove();
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }
    
    // Delete a note
    function deleteNote(noteId) {
        const index = notes.findIndex(n => n.id === noteId);
        if (index === -1) return;
        
        // Remove note
        notes.splice(index, 1);
        saveNotes();
        
        // Load another note if available
        if (notes.length > 0) {
            loadNote(notes[0].id);
        } else {
            // Clear content if no notes left (shouldn't happen due to default note)
            const notePreview = document.querySelector('.note-preview');
            if (notePreview) notePreview.innerHTML = '';
        }
        
        renderNotesList();
    }

    // Show error notification when trying to access editor-only features
    function editorError(message) {
        // Create error notification element
        const errorEl = document.createElement('div');
        errorEl.className = 'editor-error-popup glass';
        errorEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: rgba(220, 50, 50, 0.95);
            color: white;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        // Determine message based on input
        let displayMessage = 'Editor is not available';
        if (typeof message === 'string') {
            displayMessage = message;
        } else {
            displayMessage = 'This action requires the editor to be open';
        }
        
        errorEl.textContent = displayMessage;
        
        // Add animation keyframes if not already added
        if (!document.querySelector('#editorErrorAnimations')) {
            const style = document.createElement('style');
            style.id = 'editorErrorAnimations';
            style.textContent = `
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(errorEl);
        
        // Auto remove after 3 seconds with animation
        setTimeout(() => {
            errorEl.style.animation = 'slideOut 0.3s ease-in';
            setTimeout(() => errorEl.remove(), 300);
        }, 3000);
    }

    // Show header dropdown
    function showHeaderDropdown(button) {
        const textarea = document.querySelector('.note-textarea');
        if (!textarea) return;

        const dropdown = createDropdown([
            { label: 'Heading 1', action: () => insertAtCursor(textarea, '# ', '') },
            { label: 'Heading 2', action: () => insertAtCursor(textarea, '## ', '') },
            { label: 'Heading 3', action: () => insertAtCursor(textarea, '### ', '') },
            { label: 'Heading 4', action: () => insertAtCursor(textarea, '#### ', '') },
            { label: 'Heading 5', action: () => insertAtCursor(textarea, '##### ', '') },
            { label: 'Heading 6', action: () => insertAtCursor(textarea, '###### ', '') },
            { label: 'Bold', action: () => insertAtCursor(textarea, '**', '**') },
            { label: 'Italic', action: () => insertAtCursor(textarea, '*', '*') }
        ]);

        showDropdownAtElement(dropdown, button);
    }

    // Show link dropdown
    function showLinkDropdown(button) {
        const textarea = document.querySelector('.note-textarea');
        if (!textarea) return;

        const dropdown = createInputDropdown(
            'Insert Link',
            [
                { label: 'Text', placeholder: 'Link text', id: 'link-text' },
                { label: 'URL', placeholder: 'https://example.com', id: 'link-url' }
            ],
            (values) => {
                const text = values['link-text'] || 'link';
                const url = values['link-url'] || 'https://';
                insertAtCursor(textarea, `[${text}](${url})`, '');
            }
        );

        showDropdownAtElement(dropdown, button);
    }

    // Show image dropdown
    function showImageDropdown(button) {
        const textarea = document.querySelector('.note-textarea');
        if (!textarea) return;

        const dropdown = createInputDropdown(
            'Insert Image',
            [
                { label: 'Alt Text', placeholder: 'Image description', id: 'img-alt' },
                { label: 'URL', placeholder: 'https://example.com/image.jpg', id: 'img-url' }
            ],
            (values) => {
                const alt = values['img-alt'] || 'image';
                const url = values['img-url'] || 'https://';
                insertAtCursor(textarea, `![${alt}](${url})`, '');
            }
        );

        showDropdownAtElement(dropdown, button);
    }

    // Create dropdown menu
    function createDropdown(items) {
        const dropdown = document.createElement('div');
        dropdown.className = 'notes-dropdown glass';
        
        items.forEach(item => {
            const menuItem = document.createElement('div');
            menuItem.className = 'notes-dropdown-item';
            menuItem.textContent = item.label;
            menuItem.addEventListener('click', () => {
                item.action();
                dropdown.remove();
            });
            dropdown.appendChild(menuItem);
        });
        
        return dropdown;
    }

    // Create input dropdown
    function createInputDropdown(title, inputs, onSubmit) {
        const dropdown = document.createElement('div');
        dropdown.className = 'notes-dropdown glass notes-dropdown-form';
        
        const titleEl = document.createElement('div');
        titleEl.className = 'notes-dropdown-title';
        titleEl.textContent = title;
        dropdown.appendChild(titleEl);
        
        const values = {};
        
        inputs.forEach(input => {
            const inputGroup = document.createElement('div');
            inputGroup.className = 'notes-dropdown-input-group';
            
            const label = document.createElement('label');
            label.textContent = input.label;
            label.className = 'notes-dropdown-label';
            inputGroup.appendChild(label);
            
            const inputEl = document.createElement('input');
            inputEl.type = 'text';
            inputEl.placeholder = input.placeholder;
            inputEl.className = 'notes-dropdown-input';
            inputEl.id = input.id;
            inputGroup.appendChild(inputEl);
            
            dropdown.appendChild(inputGroup);
        });
        
        const submitBtn = document.createElement('button');
        submitBtn.textContent = 'Insert';
        submitBtn.className = 'notes-dropdown-submit';
        submitBtn.addEventListener('click', () => {
            inputs.forEach(input => {
                const inputEl = dropdown.querySelector(`#${input.id}`);
                values[input.id] = inputEl.value;
            });
            onSubmit(values);
            dropdown.remove();
        });
        dropdown.appendChild(submitBtn);
        
        return dropdown;
    }

    // Show dropdown at element position
    function showDropdownAtElement(dropdown, element) {
        // Remove any existing dropdowns
        document.querySelectorAll('.notes-dropdown').forEach(d => d.remove());
        
        const rect = element.getBoundingClientRect();
        dropdown.style.position = 'fixed';
        dropdown.style.top = `${rect.bottom + 5}px`;
        dropdown.style.left = `${rect.left}px`;
        dropdown.style.zIndex = '1000';
        
        document.body.appendChild(dropdown);
        
        // Close on click outside
        setTimeout(() => {
            const closeHandler = (e) => {
                if (!dropdown.contains(e.target) && e.target !== element) {
                    dropdown.remove();
                    document.removeEventListener('click', closeHandler);
                }
            };
            document.addEventListener('click', closeHandler);
        }, 10);
    }

    // Make divider draggable for resizing
    // Make divider draggable for resizing (notes-specific)
    function setupResizableDivider() {
        const divider = document.querySelector('.notes-resizable-divider');
        const noteInput = document.querySelector('.note-input');
        const notePreview = document.querySelector('.note-preview');
        
        if (!divider || !noteInput || !notePreview) return;
        
        let isDragging = false;
        let startX = 0;
        let startInputWidth = 0;
        let startPreviewWidth = 0;
        
        divider.addEventListener('mousedown', (e) => {
            isDragging = true;
            startX = e.clientX;
            startInputWidth = noteInput.offsetWidth;
            startPreviewWidth = notePreview.offsetWidth;
            
            // Prevent text selection while dragging
            document.body.style.userSelect = 'none';
            document.body.style.cursor = 'col-resize';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const deltaX = e.clientX - startX;
            const containerWidth = noteInput.parentElement.offsetWidth - divider.offsetWidth;
            
            // Calculate new widths
            const newInputWidth = startInputWidth + deltaX;
            const newPreviewWidth = startPreviewWidth - deltaX;
            
            // Set minimum widths (20% of container)
            const minWidth = containerWidth * 0.2;
            
            if (newInputWidth >= minWidth && newPreviewWidth >= minWidth) {
                const inputPercent = (newInputWidth / containerWidth) * 100;
                const previewPercent = (newPreviewWidth / containerWidth) * 100;
                
                noteInput.style.flex = `1 1 ${inputPercent}%`;
                notePreview.style.flex = `1 1 ${previewPercent}%`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                document.body.style.userSelect = '';
                document.body.style.cursor = '';
            }
        });
    }

    // Initialize
    loadNotes();
    renderNotesList();
    if (notes.length > 0) {
        loadNote(notes[0].id);
    }
    setupControls();
    setupResizableDivider();
    makeWindowDraggable();
    makeWindowResizable();
    setupKeyboardShortcuts();
}
