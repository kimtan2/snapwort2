// Create and initialize popup elements
let popupContainer = null;
let isPopupVisible = false;
let lernenButton = null;

// Debug logging function
function log(message, data = null) {
  const logMsg = data ? `${message}: ${JSON.stringify(data)}` : message;
  console.log(`[RussianTranslator] ${logMsg}`);
}

// Error logging function
function logError(message, error) {
  console.error(`[RussianTranslator] ERROR - ${message}:`, error);
}

// Function to get the full sentence containing the selected text
function getFullSentence(selection) {
  if (!selection.rangeCount) return '';
  
  const range = selection.getRangeAt(0);
  const text = range.toString().trim();
  
  // Get the text node containing the selection
  let node = range.startContainer;
  if (node.nodeType !== Node.TEXT_NODE) {
    // If the selection is in an element, find the text node
    const walker = document.createTreeWalker(
      node,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    node = walker.nextNode();
  }
  
  if (!node) return text;
  
  // Get the full text content
  let fullText = node.textContent;
  
  // Find the sentence boundaries
  const sentenceStart = Math.max(0, fullText.lastIndexOf('.', range.startOffset) + 1);
  const sentenceEnd = Math.min(
    fullText.length,
    fullText.indexOf('.', range.endOffset) + 1 || fullText.length
  );
  
  // Extract the sentence
  let sentence = fullText.substring(sentenceStart, sentenceEnd).trim();
  
  // If the sentence is too short, try to get more context
  if (sentence.length < 20) {
    // Try to get the parent element's text
    const parent = node.parentElement;
    if (parent) {
      const parentText = parent.textContent.trim();
      if (parentText.length > sentence.length) {
        sentence = parentText;
      }
    }
  }
  
  return sentence;
}

function createPopup() {
  // Create popup container if it doesn't exist
  if (!popupContainer) {
    popupContainer = document.createElement('div');
    popupContainer.className = 'russian-translator-popup';
    document.body.appendChild(popupContainer);
    log('Popup container created');
  }
  
  return popupContainer;
}

// Show loading state in popup
function showLoadingState(text, context) {
  const popup = createPopup();
  
  const content = document.createElement('div');
  content.className = 'popup-spinner-container';
  
  const header = document.createElement('div');
  header.className = 'popup-header';
  header.textContent = `Looking up: "${text}"`;
  
  const contextElement = document.createElement('div');
  contextElement.className = 'popup-context';
  contextElement.textContent = `Context: "${context.substring(0, 100)}${context.length > 100 ? '...' : ''}"`;
  
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  
  content.appendChild(header);
  content.appendChild(contextElement);
  content.appendChild(spinner);
  
  popup.innerHTML = '';
  popup.appendChild(content);
  
  positionPopupNearSelection();
  popup.style.display = 'block';
  isPopupVisible = true;
  log('Showing loading state', { text, contextLength: context.length });
}

// Show results in popup
function showResultInPopup(data) {
  log('Showing result in popup', { success: data.success });
  const popup = createPopup();
  popup.innerHTML = '';
  
  if (!data.success) {
    const errorContainer = document.createElement('div');
    errorContainer.className = 'popup-error';
    
    const errorTitle = document.createElement('div');
    errorTitle.className = 'popup-error-title';
    errorTitle.textContent = 'Error';
    
    const errorMessage = document.createElement('div');
    errorMessage.textContent = data.error || 'Unknown error occurred';
    
    errorContainer.appendChild(errorTitle);
    errorContainer.appendChild(errorMessage);
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-popup-btn';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', hidePopup);
    
    buttonContainer.appendChild(closeButton);
    
    popup.appendChild(errorContainer);
    popup.appendChild(buttonContainer);
  } else {
    // Process the definition text to apply styling
    let formattedDefinition = processDefinitionFormatting(data.definition);
    
    const titleContainer = document.createElement('div');
    titleContainer.className = 'popup-title';
    
    const wordElement = document.createElement('div');
    wordElement.className = 'popup-word';
    wordElement.textContent = data.text;
    
    titleContainer.appendChild(wordElement);
    
    const definitionContainer = document.createElement('div');
    definitionContainer.className = 'popup-definition';
    definitionContainer.innerHTML = formattedDefinition;
    
    const buttonContainer = document.createElement('div');
    buttonContainer.className = 'popup-buttons';
    
    const saveButton = document.createElement('button');
    saveButton.className = 'save-to-library-btn';
    saveButton.textContent = 'Save to Library';
    saveButton.addEventListener('click', function() {
      saveToLibrary(data.text, data.definition);
    });
    
    const closeButton = document.createElement('button');
    closeButton.className = 'close-popup-btn';
    closeButton.textContent = 'Close';
    closeButton.addEventListener('click', hidePopup);
    
    buttonContainer.appendChild(saveButton);
    buttonContainer.appendChild(closeButton);
    
    popup.appendChild(titleContainer);
    popup.appendChild(definitionContainer);
    popup.appendChild(buttonContainer);
  }
  
  positionPopupNearSelection();
  popup.style.display = 'block';
  isPopupVisible = true;
}

// Process and format the definition text with styling
function processDefinitionFormatting(text) {
  if (!text) return '';
  
  // Replace double newlines with proper dividers
  let formatted = text.replace(/\n\n+/g, '<hr class="content-divider">');
  
  // Process markdown-style formatting
  formatted = formatted
    // Bold text (between ** or __)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/__(.*?)__/g, '<strong>$1</strong>')
    // Italic text (between * or _)
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/_(.*?)_/g, '<em>$1</em>')
    // Code blocks (between `)
    .replace(/`(.*?)`/g, '<code class="inline-code">$1</code>');
  
  // Split by lines for individual styling
  let lines = formatted.split('\n');
  let result = [];
  let inExampleBlock = false;
  
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();
    
    // Skip empty lines but add space
    if (!line) {
      if (inExampleBlock) {
        result.push('<div class="content-space-small"></div>');
      } else {
        result.push('<div class="content-space"></div>');
      }
      continue;
    }
    
    // Detect different components of the response
    const hasCyrillic = /[а-яА-ЯёЁ]/.test(line);
    const isExampleLine = line.startsWith('Example:');
    
    // Russian translation heading (standalone Cyrillic word or phrase)
    if (hasCyrillic && !isExampleLine && !line.includes('.') && !inExampleBlock) {
      result.push(`<div class="russian-word">${line}</div>`);
    }
    // Example label line
    else if (isExampleLine) {
      inExampleBlock = true;
      let exampleText = line.replace('Example:', '<span class="example-label">Example:</span>');
      result.push(`<div class="example-text">${exampleText}</div>`);
    }
    // Example sentence (English with quotes, likely follows an "Example:" line)
    else if (inExampleBlock || (line.includes('"') && line.match(/[a-zA-Z]/))) {
      inExampleBlock = line.includes('"'); // Stay in example block if it has quotes
      result.push(`<div class="example-sentence">${line}</div>`);
    }
    // Any line with Cyrillic inside an English sentence (likely a translation in parentheses)
    else if (hasCyrillic && line.includes('(') && line.includes(')')) {
      result.push(`<div class="cyrillic-translation">${line}</div>`);
      inExampleBlock = false;
    }
    // Regular English content
    else if (line.match(/[a-zA-Z]/)) {
      result.push(`<div class="content-english">${line}</div>`);
      inExampleBlock = false;
    }
    // Default formatting for anything else
    else {
      result.push(`<div>${line}</div>`);
      inExampleBlock = false;
    }
  }
  
  return result.join('');
}

// Position popup near the selected text
function positionPopupNearSelection() {
  if (!popupContainer) return;
  
  const selection = window.getSelection();
  
  if (!selection.rangeCount) return;
  
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();
  
  // Calculate position
  let top = rect.bottom + window.scrollY + 10; // 10px below selection
  let left = rect.left + window.scrollX;
  
  // Adjust position to keep popup within viewport
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const popupWidth = 350; // Width defined in CSS
  
  // Adjust horizontally if needed
  if (left + popupWidth > viewportWidth - 20) {
    left = viewportWidth - popupWidth - 20;
  }
  
  // If popup would appear below viewport, position it above the selection
  if (top + 200 > window.scrollY + viewportHeight) {
    top = rect.top + window.scrollY - 10 - popupContainer.offsetHeight;
  }
  
  // Apply position
  popupContainer.style.top = `${top}px`;
  popupContainer.style.left = `${left}px`;
  
  log('Positioned popup', { top, left });
}

// Hide popup
function hidePopup() {
  if (popupContainer) {
    popupContainer.style.display = 'none';
    isPopupVisible = false;
    log('Popup hidden');
  }
}

// Function to save word to library
function saveToLibrary(word, definition) {
  log('Saving word to library', { word, definitionLength: definition.length });
  
  if (!word || !definition) {
    logError('Cannot save word to library', { error: 'Word or definition is empty' });
    return;
  }
  
  // Show visual feedback
  const saveBtn = document.querySelector('.save-to-library-btn');
  if (saveBtn) {
    saveBtn.disabled = true; // Disable to prevent multiple clicks
    saveBtn.textContent = 'Saving...';
    saveBtn.classList.add('saving');
    saveBtn.classList.remove('saved', 'error');
  }
  
  // Specific debugging for this save operation
  console.log(`[RussianTranslator SAVE] Saving word to Firestore: "${word}"`);
  console.log(`[RussianTranslator SAVE] Definition length: ${definition.length} characters`);
  
  try {
    chrome.runtime.sendMessage({
      action: "saveToLibrary",
      word: word,
      definition: definition
    }, function(response) {
      console.log('[RussianTranslator SAVE] Response received:', response);
      
      // Timeout in case we don't get a response
      const responseTimeout = setTimeout(() => {
        if (saveBtn) {
          saveBtn.textContent = 'Save to Library';
          saveBtn.classList.remove('saving', 'saved', 'error');
          saveBtn.disabled = false;
          console.log('[RussianTranslator SAVE] Response timeout - resetting button');
        }
      }, 3000);
      
      // If we got a response, handle it
      if (response) {
        clearTimeout(responseTimeout);
        
        if (response.success) {
          log('Word saved successfully', { response });
          // Update button to show success
          if (saveBtn) {
            saveBtn.textContent = 'Saved!';
            saveBtn.classList.remove('saving', 'error');
            saveBtn.classList.add('saved');
            
            // Re-enable after a short delay
            setTimeout(() => {
              saveBtn.textContent = 'Save to Library';
              saveBtn.classList.remove('saved');
              saveBtn.disabled = false;
            }, 2000);
          }
        } else {
          logError('Failed to save word', { error: response.error });
          // Update button to show failure
          if (saveBtn) {
            saveBtn.textContent = 'Failed to Save';
            saveBtn.classList.remove('saving', 'saved');
            saveBtn.classList.add('error');
            
            // Add title/tooltip with error
            saveBtn.title = response.error || 'Unknown error';
            
            // Re-enable after a delay
            setTimeout(() => {
              saveBtn.textContent = 'Try Again';
              saveBtn.classList.remove('error');
              saveBtn.disabled = false;
            }, 2000);
          }
        }
      }
    });
    
    // Safety net - re-enable button after 5 seconds no matter what
    setTimeout(() => {
      if (saveBtn && saveBtn.disabled) {
        saveBtn.textContent = 'Save to Library';
        saveBtn.classList.remove('saving', 'saved', 'error');
        saveBtn.disabled = false;
        console.log('[RussianTranslator SAVE] Safety timeout - resetting button');
      }
    }, 5000);
    
  } catch (error) {
    logError('Error sending saveToLibrary message', error);
    // Update button to show error
    if (saveBtn) {
      saveBtn.textContent = 'Error';
      saveBtn.classList.remove('saving', 'saved');
      saveBtn.classList.add('error');
      saveBtn.title = error.message || 'Unknown error';
      
      // Re-enable after a delay
      setTimeout(() => {
        saveBtn.textContent = 'Try Again';
        saveBtn.classList.remove('error');
        saveBtn.disabled = false;
      }, 2000);
    }
  }
}

// Create the Lernen button
function createLernenButton() {
  if (!lernenButton) {
    lernenButton = document.createElement('button');
    lernenButton.textContent = 'Lernen';
    lernenButton.className = 'lernen-button';
    
    lernenButton.addEventListener('click', showLernenPopup);
    document.body.appendChild(lernenButton);
    log('Lernen button created');
  }
}

// Create and show the Lernen popup
function showLernenPopup() {
  log('Showing Lernen popup');
  const popup = document.createElement('div');
  popup.className = 'lernen-popup';
  
  const content = document.createElement('div');
  content.className = 'lernen-popup-content';
  
  const link = document.createElement('a');
  link.id = 'goToAppLink';
  link.href = '#';
  link.className = 'go-to-app-link';
  link.textContent = 'Go to the app';
  link.addEventListener('click', (e) => {
    e.preventDefault();
    chrome.runtime.sendMessage({action: "openAppPage"});
    document.body.removeChild(popup);
    log('Opening app page');
  });
  
  const closeButton = document.createElement('button');
  closeButton.id = 'closeLernenPopup';
  closeButton.className = 'close-lernen-btn';
  closeButton.textContent = 'Close';
  closeButton.addEventListener('click', () => {
    document.body.removeChild(popup);
    log('Lernen popup closed');
  });
  
  content.appendChild(link);
  content.appendChild(closeButton);
  popup.appendChild(content);
  
  document.body.appendChild(popup);
  
  // Close popup when clicking outside
  document.addEventListener('mousedown', function clickOutside(event) {
    if (!popup.contains(event.target) && event.target !== lernenButton) {
      document.body.removeChild(popup);
      document.removeEventListener('mousedown', clickOutside);
      log('Lernen popup closed by outside click');
    }
  });
}

// Close popup when clicking outside
document.addEventListener('mousedown', (event) => {
  if (isPopupVisible && popupContainer && !popupContainer.contains(event.target)) {
    hidePopup();
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  log('Received message', { action: message.action });
  
  if (message.action === 'showLoading') {
    const selection = window.getSelection();
    const context = getFullSentence(selection);
    showLoadingState(message.text, context);
    
    // Send the context back to the background script
    chrome.runtime.sendMessage({
      action: "getDefinition",
      text: message.text,
      context: context
    });
  } else if (message.action === 'showResult') {
    showResultInPopup(message);
  } else if (message.action === 'saveResult') {
    // Could show a toast notification here
    log('Save result', { success: message.success, message: message.message });
  }
  
  return true;
});

// Initialize everything when the content script runs
function initializeExtension() {
  log('Initializing extension');
  createPopup();
  createLernenButton();
}

// Run initialization when the page is fully loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExtension);
} else {
  initializeExtension();
} 