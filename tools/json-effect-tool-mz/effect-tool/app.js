const FRAME_RATE = 60;
const TOTAL_FRAMES = 60;
const FRAME_INTERVAL_MS = 1000 / FRAME_RATE;

const preview = document.getElementById("preview");
const trailLayer = document.getElementById("trailLayer");
const previewLayer = document.getElementById("previewLayer");
const drawCanvas = document.getElementById("drawCanvas");
const drawHint = document.getElementById("drawHint");
const drawCtx = drawCanvas.getContext("2d");

const frameSlider = document.getElementById("frameSlider");
const frameLabel = document.getElementById("frameLabel");
const stateText = document.getElementById("stateText");

const prevFrameBtn = document.getElementById("prevFrameBtn");
const nextFrameBtn = document.getElementById("nextFrameBtn");
const copyPrevBtn = document.getElementById("copyPrevBtn");
const playBtn = document.getElementById("playBtn");

const addObjectBtn = document.getElementById("addObjectBtn");
const duplicateObjectBtn = document.getElementById("duplicateObjectBtn");
const renameObjectBtn = document.getElementById("renameObjectBtn");
const deleteObjectBtn = document.getElementById("deleteObjectBtn");
const objectList = document.getElementById("objectList");

const exportJsonBtn = document.getElementById("exportJsonBtn");
const importJsonBtn = document.getElementById("importJsonBtn");
const jsonArea = document.getElementById("jsonArea");

const startFrameValue = document.getElementById("startFrameValue");
const endFrameValue = document.getElementById("endFrameValue");
const opacityValue = document.getElementById("opacityValue");

const dxValue = document.getElementById("dxValue");
const dyValue = document.getElementById("dyValue");
const dSizeValue = document.getElementById("dSizeValue");
const dOpacityValue = document.getElementById("dOpacityValue");
const rotationValue = document.getElementById("rotationValue");
const dRotationValue = document.getElementById("dRotationValue");

const moveModeText = document.getElementById("moveModeText");
const waveAmpValue = document.getElementById("waveAmpValue");
const waveSpeedValue = document.getElementById("waveSpeedValue");
const radiusStepValue = document.getElementById("radiusStepValue");
const rotateSpeedValue = document.getElementById("rotateSpeedValue");

const trailFadeValue = document.getElementById("trailFadeValue");
const trailDensityValue = document.getElementById("trailDensityValue");

const startPathBtn = document.getElementById("startPathBtn");
const applyPathBtn = document.getElementById("applyPathBtn");
const cancelPathBtn = document.getElementById("cancelPathBtn");
const pathStatusText = document.getElementById("pathStatusText");
const auraEnabledValue = document.getElementById("auraEnabledValue");
const auraSizeValue = document.getElementById("auraSizeValue");
const auraAlphaValue = document.getElementById("auraAlphaValue");
const thinValue = document.getElementById("thinValue");
const effectNameInput = document.getElementById("effectNameInput");
const effectKeyInput = document.getElementById("effectKeyInput");
const coordinateModeSelect = document.getElementById("coordinateModeSelect");
const sourceXInput = document.getElementById("sourceXInput");
const targetXInput = document.getElementById("targetXInput");
const downloadJsonBtn = document.getElementById("downloadJsonBtn");
const loadJsonFileBtn = document.getElementById("loadJsonFileBtn");
const jsonFileInput = document.getElementById("jsonFileInput");
const loadMzLibraryBtn = document.getElementById("loadMzLibraryBtn");
const saveMzLibraryBtn = document.getElementById("saveMzLibraryBtn");
const mzLibraryFileInput = document.getElementById("mzLibraryFileInput");
const mzLibraryStatusText = document.getElementById("mzLibraryStatusText");
const pickSoundFolderBtn = document.getElementById("pickSoundFolderBtn");
const reconnectSoundFolderBtn = document.getElementById("reconnectSoundFolderBtn");
const pickSoundFilesBtn = document.getElementById("pickSoundFilesBtn");
const clearSoundSourceBtn = document.getElementById("clearSoundSourceBtn");
const soundFilesInput = document.getElementById("soundFilesInput");
const soundFolderInput = document.getElementById("soundFolderInput");
const soundSourceStatusText = document.getElementById("soundSourceStatusText");
const selectedSoundName = document.getElementById("selectedSoundName");
const previewSoundBtn = document.getElementById("previewSoundBtn");
const addSoundEventBtn = document.getElementById("addSoundEventBtn");
const soundEventList = document.getElementById("soundEventList");
const soundFileCountText = document.getElementById("soundFileCountText");
const soundSelect = document.getElementById("soundSelect");

let currentFrame = 0;
let selectedObjectIndex = 0;
let playTimer = null;

let isPathMode = false;
let isDrawing = false;
let drawnPath = [];

let trails = [];
let trailFade = 0.08;
let trailDensity = 4;

let soundSourceLabel = "";
let soundFiles = [];
let selectedSoundId = "";
let lastPlayedSoundFrame = -1;
let currentSoundDirectoryHandle = null;
let mzLibrary = {};

const effectData = {
  duration: TOTAL_FRAMES,
  objects: [createObject("obj1")],
  soundEvents: []
};

function createDefaultFrame() {
  return {
    x: 140,
    y: 140,
    size: 60,
    shape: "square",
    color: "cyan",
    opacity: 1,
    rotation: 0,

    auraEnabled: false,
    auraSize: 12,
    auraAlpha: 0.25,
    thinX: 1.0,

    dx: 0,
    dy: 0,
    dSize: 0,
    dOpacity: 0,
    dRotation: 0,
    moveMode: "manual",
    waveAmp: 20,
    waveSpeed: 0.3,
    radiusStep: 2,
    rotateSpeed: 0.2,
    spiralAngle: 0,
    spiralRadius: 10
  };
}

function createObject(name) {
  return {
    id: Date.now() + Math.floor(Math.random() * 100000),
    name,
    startFrame: 0,
    endFrame: TOTAL_FRAMES - 1,
    pathPoints: null,
    frames: Array.from({ length: TOTAL_FRAMES }, () => createDefaultFrame())
  };
}

function cloneFrame(src) {
  return {
    x: src.x,
    y: src.y,
    size: src.size,
    shape: src.shape,
    color: src.color,
    opacity: src.opacity,
    rotation: src.rotation,

    auraEnabled: src.auraEnabled,
    auraSize: src.auraSize,
    auraAlpha: src.auraAlpha,
    thinX: src.thinX,

    dx: src.dx,
    dy: src.dy,
    dSize: src.dSize,
    dOpacity: src.dOpacity,
    dRotation: src.dRotation,
    moveMode: src.moveMode,
    waveAmp: src.waveAmp,
    waveSpeed: src.waveSpeed,
    radiusStep: src.radiusStep,
    rotateSpeed: src.rotateSpeed,
    spiralAngle: src.spiralAngle,
    spiralRadius: src.spiralRadius
  };
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function round1(value) {
  return Math.round(value * 10) / 10;
}
function round2(value) {
  return Math.round(value * 100) / 100;
}

function getSelectedObject() {
  return effectData.objects[selectedObjectIndex];
}

function getSelectedState() {
  return getSelectedObject().frames[currentFrame];
}

function isVisibleAtFrame(obj, frame) {
  return frame >= obj.startFrame && frame <= obj.endFrame;
}

function applyShapeStyle(el, shape, size, color) {
  el.style.background = "transparent";
  el.style.borderLeft = "0 solid transparent";
  el.style.borderRight = "0 solid transparent";
  el.style.borderTop = "0 solid transparent";
  el.style.borderBottom = "0 solid transparent";
  el.style.width = "0px";
  el.style.height = "0px";
  el.style.borderRadius = "0";

  if (shape === "square") {
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.background = color;
    el.style.transformOrigin = "50% 50%";
  } else if (shape === "circle") {
    el.style.width = size + "px";
    el.style.height = size + "px";
    el.style.background = color;
    el.style.borderRadius = "50%";
    el.style.transformOrigin = "50% 50%";
  } else if (shape === "triangle") {
    el.style.width = "0px";
    el.style.height = "0px";
    el.style.background = "transparent";
    el.style.borderLeft = size / 2 + "px solid transparent";
    el.style.borderRight = size / 2 + "px solid transparent";
    el.style.borderBottom = size + "px solid " + color;
    el.style.transformOrigin = "50% 66%";
  }
}

function applyShapeToElement(el, state) {
  el.innerHTML = "";
  el.className = (el.className || "").replace(/\bshape-wrapper\b/g, "").trim();
  el.classList.add("shape-wrapper");

  const auraSize = state.size + state.auraSize;

  if (state.auraEnabled) {
    const aura = document.createElement("div");
    aura.className = "shape-part aura-part";
    applyShapeStyle(aura, state.shape, auraSize, state.color);
    aura.style.opacity = state.auraAlpha;
    aura.style.left = (-auraSize / 2) + "px";
    aura.style.top = (-auraSize / 2) + "px";
    aura.style.transform = `scaleX(${state.thinX})`;
    el.appendChild(aura);
  }

  const core = document.createElement("div");
  core.className = "shape-part core-part";
  applyShapeStyle(core, state.shape, state.size, state.color);
  core.style.left = (-state.size / 2) + "px";
  core.style.top = (-state.size / 2) + "px";
  core.style.transform = `scaleX(${state.thinX})`;
  el.appendChild(core);
}

function resizeCanvasToPreview() {
  const rect = preview.getBoundingClientRect();
  drawCanvas.width = rect.width;
  drawCanvas.height = rect.height;
  redrawPathCanvas();
}

function redrawPathCanvas() {
  drawCtx.clearRect(0, 0, drawCanvas.width, drawCanvas.height);

  if (drawnPath.length < 2) return;

  drawCtx.lineWidth = 2;
  drawCtx.strokeStyle = "rgba(255,255,255,0.9)";
  drawCtx.lineJoin = "round";
  drawCtx.lineCap = "round";

  drawCtx.beginPath();
  drawCtx.moveTo(drawnPath[0].x, drawnPath[0].y);

  for (let i = 1; i < drawnPath.length - 1; i++) {
    const cx = (drawnPath[i].x + drawnPath[i + 1].x) / 2;
    const cy = (drawnPath[i].y + drawnPath[i + 1].y) / 2;
    drawCtx.quadraticCurveTo(drawnPath[i].x, drawnPath[i].y, cx, cy);
  }

  const last = drawnPath[drawnPath.length - 1];
  drawCtx.lineTo(last.x, last.y);
  drawCtx.stroke();
}

function clearTrails() {
  for (const trail of trails) {
    trail.el.remove();
  }
  trails = [];
}

function updateTrails() {
  const nextTrails = [];

  for (const trail of trails) {
    trail.opacity = clamp(trail.opacity - trailFade, 0, 1);
    trail.el.style.opacity = trail.opacity;

    if (trail.opacity > 0) {
      nextTrails.push(trail);
    } else {
      trail.el.remove();
    }
  }

  trails = nextTrails;
}

function addSingleTrail(temp) {
  const el = document.createElement("div");
  el.className = "trail-piece";

  applyShapeToElement(el, temp);
  el.style.left = temp.x + "px";
  el.style.top = temp.y + "px";
  el.style.opacity = temp.opacity;
el.style.transform = `translate(-50%, -50%) rotate(${temp.rotation}deg)`;

  trailLayer.appendChild(el);

  trails.push({
    el,
    opacity: temp.opacity
  });
}

function addTrailBetween(fromState, toState) {
  if (!fromState || !toState) return;
  if (trailDensity <= 0) return;

  const count = trailDensity;

  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 1 : i / (count - 1);

    const temp = {
      x: Math.round(fromState.x + (toState.x - fromState.x) * t),
      y: Math.round(fromState.y + (toState.y - fromState.y) * t),
      size: fromState.size + (toState.size - fromState.size) * t,
      shape: toState.shape,
      color: toState.color,
      opacity: fromState.opacity + (toState.opacity - fromState.opacity) * t,
      rotation: fromState.rotation + (toState.rotation - fromState.rotation) * t,

      auraEnabled: t < 0.5 ? fromState.auraEnabled : toState.auraEnabled,
      auraSize: fromState.auraSize + (toState.auraSize - fromState.auraSize) * t,
      auraAlpha: fromState.auraAlpha + (toState.auraAlpha - fromState.auraAlpha) * t,
      thinX: fromState.thinX + (toState.thinX - fromState.thinX) * t
    };

    addSingleTrail(temp);
  }
}

function renderPreview() {
  previewLayer.innerHTML = "";

  effectData.objects.forEach((obj, index) => {
    const visible = isVisibleAtFrame(obj, currentFrame);
    const beforeStart = currentFrame < obj.startFrame;
    const afterEnd = currentFrame > obj.endFrame;
    const forceShowForEdit = index === selectedObjectIndex && beforeStart;

    if ((!visible && !forceShowForEdit) || afterEnd) return;

    const state = obj.frames[currentFrame];
    const el = document.createElement("div");
    el.className = "preview-shape";

    if (index === selectedObjectIndex) {
      el.classList.add("selected");
    }
    if (!visible) {
      el.classList.add("out-of-range");
    }

    applyShapeToElement(el, state);
    el.style.left = state.x + "px";
    el.style.top = state.y + "px";
    el.style.opacity = visible ? state.opacity : Math.min(state.opacity, 0.25);
 el.style.transform = `translate(-50%, -50%) rotate(${state.rotation}deg)`;
    el.style.zIndex = String(index === selectedObjectIndex ? 999 : index + 1);

    previewLayer.appendChild(el);
  });
}

function bindRepeatButton(button, action, options = {}) {
  const startDelay = options.startDelay ?? 300;
  const intervalMs = options.intervalMs ?? 60;

  let holdTimer = null;
  let repeatTimer = null;
  let didRepeat = false;
  let activePointerId = null;

  function clearTimers() {
    if (holdTimer) {
      clearTimeout(holdTimer);
      holdTimer = null;
    }
    if (repeatTimer) {
      clearInterval(repeatTimer);
      repeatTimer = null;
    }
    didRepeat = false;
    activePointerId = null;
  }

  function stopFromWindow(e) {
    if (activePointerId == null) return;
    if (e.pointerId != null && e.pointerId !== activePointerId) return;
    clearTimers();
  }

  button.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  button.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    clearTimers();
    activePointerId = e.pointerId;
    didRepeat = false;

    try {
      button.setPointerCapture(e.pointerId);
    } catch (_) {
    }

    holdTimer = setTimeout(() => {
      didRepeat = true;
      action();
      repeatTimer = setInterval(action, intervalMs);
    }, startDelay);
  });

  button.addEventListener("pointerup", (e) => {
    e.preventDefault();
    const wasRepeat = didRepeat;
    clearTimers();

    if (!wasRepeat) {
      action();
    }
  });

  button.addEventListener("pointercancel", clearTimers);
  button.addEventListener("lostpointercapture", clearTimers);

  window.addEventListener("pointerup", stopFromWindow);
  window.addEventListener("pointercancel", stopFromWindow);
  window.addEventListener("blur", clearTimers);
}

function renderObjectList() {
  objectList.innerHTML = "";

  effectData.objects.forEach((obj, index) => {
    const item = document.createElement("div");
    item.className = "object-item" + (index === selectedObjectIndex ? " selected" : "");

    const name = document.createElement("div");
    name.className = "object-name";
    name.textContent = obj.name;

    const info = document.createElement("div");
    info.textContent = `${obj.startFrame}-${obj.endFrame}`;

    item.appendChild(name);
    item.appendChild(info);

    item.addEventListener("click", () => {
      selectedObjectIndex = index;
      render();
    });

    objectList.appendChild(item);
  });
}

function clearSoundSource() {
  soundSourceLabel = "";
  soundFiles = [];
  selectedSoundId = "";
  currentSoundDirectoryHandle = null;
  clearSavedSoundDirectoryHandle();
  renderSoundSource();
  renderSoundEvents();
}

function getAudioExt(name) {
  const m = String(name || "").match(/\.([^.]+)$/);
  return m ? m[1].toLowerCase() : "";
}

function isAudioFile(file) {
  if (!file) return false;
  if (typeof file.type === "string" && file.type.startsWith("audio/")) return true;
  const ext = getAudioExt(file.name);
  return ["ogg", "mp3", "wav", "m4a", "aac", "flac"].includes(ext);
}

function normalizeSoundEntry(file, index = 0) {
  const relativePath =
    file.webkitRelativePath && file.webkitRelativePath.trim()
      ? file.webkitRelativePath
      : file.name;

  return {
    id: `${Date.now()}_${index}_${Math.floor(Math.random() * 100000)}`,
    name: file.name,
    relativePath,
    size: Number(file.size || 0),
    type: file.type || "",
    file
  };
}

function addSoundFiles(fileList, sourceLabel = "") {
  const files = Array.from(fileList || []).filter(isAudioFile);
  if (files.length === 0) {
    alert("音声ファイルが見つかりません");
    return;
  }

  const existingByPath = new Map(soundFiles.map((item) => [item.relativePath, item]));

  files.forEach((file, index) => {
    const entry = normalizeSoundEntry(file, index);
    existingByPath.set(entry.relativePath, entry);
  });

  soundFiles = Array.from(existingByPath.values()).sort((a, b) =>
    a.relativePath.localeCompare(b.relativePath, "ja")
  );

  if (sourceLabel) {
    soundSourceLabel = sourceLabel;
  } else if (!soundSourceLabel) {
    soundSourceLabel = `${soundFiles.length} files`;
  }

  if (!selectedSoundId && soundFiles.length > 0) {
    selectedSoundId = soundFiles[0].id;
  } else if (selectedSoundId) {
    const stillExists = soundFiles.some((item) => item.id === selectedSoundId);
    if (!stillExists) {
      selectedSoundId = soundFiles[0]?.id || "";
    }
  }

  relinkSoundEvents();
  renderSoundSource();
  renderSoundEvents();
}

function relinkSoundEvents() {
  const events = Array.isArray(effectData.soundEvents) ? effectData.soundEvents : [];
  if (events.length === 0 || soundFiles.length === 0) return;

  events.forEach((event) => {
    let matched =
      soundFiles.find((item) => item.relativePath === event.relativePath) ||
      soundFiles.find((item) => item.name === event.name) ||
      null;

    if (matched) {
      event.soundId = matched.id;
      event.name = matched.name;
      event.relativePath = matched.relativePath;
    }
  });
}

function formatBytes(bytes) {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function renderSoundSource() {
  soundSourceStatusText.textContent =
    soundFiles.length > 0
      ? `${soundSourceLabel || "読み込み済み"} / ${soundFiles.length}件`
      : "未設定";

  const selected = soundFiles.find((item) => item.id === selectedSoundId);
  selectedSoundName.textContent = selected ? selected.relativePath : "なし";

  soundSelect.innerHTML = "";

  const emptyOption = document.createElement("option");
  emptyOption.value = "";
  emptyOption.textContent = soundFiles.length > 0 ? "効果音を選択" : "効果音なし";
  soundSelect.appendChild(emptyOption);

  soundFiles.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.relativePath;
    soundSelect.appendChild(option);
  });

  soundSelect.value = selectedSoundId || "";
  soundFileCountText.textContent = `${soundFiles.length}`;
  reconnectSoundFolderBtn.disabled = typeof window.showDirectoryPicker !== "function";
}

function createSoundEvent(sound, frame) {
  return {
    id: Date.now() + Math.floor(Math.random() * 100000),
    frame,
    soundId: sound.id,
    name: sound.name,
    relativePath: sound.relativePath,
    volume: 90,
    pitch: 100,
    pan: 0
  };
}

function getSelectedSound() {
  return soundFiles.find((item) => item.id === selectedSoundId) || null;
}

function addSoundEventAtCurrentFrame() {
  const sound = getSelectedSound();
  if (!sound) {
    alert("効果音を選んでください");
    return;
  }

  effectData.soundEvents.push(createSoundEvent(sound, currentFrame));
  effectData.soundEvents.sort((a, b) => {
    if (a.frame !== b.frame) return a.frame - b.frame;
    return a.relativePath.localeCompare(b.relativePath, "ja");
  });

  renderSoundEvents();
}

function renderSoundEvents() {
  soundEventList.innerHTML = "";

  const events = Array.isArray(effectData.soundEvents) ? effectData.soundEvents : [];

  events.forEach((event) => {
    const linked =
      soundFiles.find((item) => item.id === event.soundId) ||
      soundFiles.find((item) => item.relativePath === event.relativePath) ||
      soundFiles.find((item) => item.name === event.name) ||
      null;

    const item = document.createElement("div");
    item.className = "sound-event-item";

    const head = document.createElement("div");
    head.className = "sound-event-head";

    const title = document.createElement("div");
    title.className = "sound-event-title";
    title.textContent = event.relativePath || event.name || "sound";

    const frame = document.createElement("div");
    frame.className = "sound-event-frame";
    frame.textContent = `F${event.frame}`;

    head.appendChild(title);
    head.appendChild(frame);

    const meta = document.createElement("div");
    meta.className = "sound-event-meta";
    meta.textContent =
      `vol:${event.volume} pitch:${event.pitch} pan:${event.pan}` +
      (linked ? " / linked" : " / missing");

    const edit = document.createElement("div");
    edit.className = "sound-event-edit";

    const frameRow = document.createElement("div");
    frameRow.className = "delta-row";

    const frameLabel = document.createElement("span");
    frameLabel.textContent = "frame";

    const frameDownBtn = document.createElement("button");
    frameDownBtn.type = "button";
    frameDownBtn.textContent = "-1";

    const frameValue = document.createElement("span");
    frameValue.textContent = String(event.frame);

    const frameUpBtn = document.createElement("button");
    frameUpBtn.type = "button";
    frameUpBtn.textContent = "+1";

    frameRow.appendChild(frameLabel);
    frameRow.appendChild(frameDownBtn);
    frameRow.appendChild(frameValue);
    frameRow.appendChild(frameUpBtn);

    bindRepeatButton(frameDownBtn, () => {
      updateSoundEventFrame(event.id, -1);
    });
    bindRepeatButton(frameUpBtn, () => {
      updateSoundEventFrame(event.id, 1);
    });

    const volRow = document.createElement("div");
    volRow.className = "delta-row";

    const volLabel = document.createElement("span");
    volLabel.textContent = "vol";

    const volDownBtn = document.createElement("button");
    volDownBtn.type = "button";
    volDownBtn.textContent = "-10";

    const volValue = document.createElement("span");
    volValue.textContent = String(event.volume);

    const volUpBtn = document.createElement("button");
    volUpBtn.type = "button";
    volUpBtn.textContent = "+10";

    volRow.appendChild(volLabel);
    volRow.appendChild(volDownBtn);
    volRow.appendChild(volValue);
    volRow.appendChild(volUpBtn);

    bindRepeatButton(volDownBtn, () => {
      updateSoundEventValue(event.id, "volume", -10, 0, 100);
    });
    bindRepeatButton(volUpBtn, () => {
      updateSoundEventValue(event.id, "volume", 10, 0, 100);
    });

    const pitchRow = document.createElement("div");
    pitchRow.className = "delta-row";

    const pitchLabel = document.createElement("span");
    pitchLabel.textContent = "pitch";

    const pitchDownBtn = document.createElement("button");
    pitchDownBtn.type = "button";
    pitchDownBtn.textContent = "-10";

    const pitchValue = document.createElement("span");
    pitchValue.textContent = String(event.pitch);

    const pitchUpBtn = document.createElement("button");
    pitchUpBtn.type = "button";
    pitchUpBtn.textContent = "+10";

    pitchRow.appendChild(pitchLabel);
    pitchRow.appendChild(pitchDownBtn);
    pitchRow.appendChild(pitchValue);
    pitchRow.appendChild(pitchUpBtn);

    bindRepeatButton(pitchDownBtn, () => {
      updateSoundEventValue(event.id, "pitch", -10, 50, 200);
    });
    bindRepeatButton(pitchUpBtn, () => {
      updateSoundEventValue(event.id, "pitch", 10, 50, 200);
    });

    const panRow = document.createElement("div");
    panRow.className = "delta-row";

    const panLabel = document.createElement("span");
    panLabel.textContent = "pan";

    const panDownBtn = document.createElement("button");
    panDownBtn.type = "button";
    panDownBtn.textContent = "-10";

    const panValue = document.createElement("span");
    panValue.textContent = String(event.pan);

    const panUpBtn = document.createElement("button");
    panUpBtn.type = "button";
    panUpBtn.textContent = "+10";

    panRow.appendChild(panLabel);
    panRow.appendChild(panDownBtn);
    panRow.appendChild(panValue);
    panRow.appendChild(panUpBtn);

    bindRepeatButton(panDownBtn, () => {
      updateSoundEventValue(event.id, "pan", -10, -100, 100);
    });
    bindRepeatButton(panUpBtn, () => {
      updateSoundEventValue(event.id, "pan", 10, -100, 100);
    });

    edit.appendChild(frameRow);
    edit.appendChild(volRow);
    edit.appendChild(pitchRow);
    edit.appendChild(panRow);

    const actions = document.createElement("div");
    actions.className = "sound-event-actions";

    const jumpBtn = document.createElement("button");
    jumpBtn.type = "button";
    jumpBtn.textContent = "移動";
    jumpBtn.addEventListener("click", () => {
      setFrame(event.frame);
    });

    const testBtn = document.createElement("button");
    testBtn.type = "button";
    testBtn.textContent = "試聴";
    testBtn.addEventListener("click", () => {
      previewSoundEvent(event);
    });

    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.textContent = "削除";
    deleteBtn.addEventListener("click", () => {
      deleteSoundEvent(event.id);
    });

    actions.appendChild(jumpBtn);
    actions.appendChild(testBtn);
    actions.appendChild(deleteBtn);

    item.appendChild(head);
    item.appendChild(meta);
    item.appendChild(edit);
    item.appendChild(actions);

    soundEventList.appendChild(item);
  });
}

function deleteSoundEvent(eventId) {
  effectData.soundEvents = effectData.soundEvents.filter((event) => event.id !== eventId);
  renderSoundEvents();
}

function updateSoundEventValue(eventId, key, delta, min, max) {
  const event = effectData.soundEvents.find((item) => item.id === eventId);
  if (!event) return;

  const current = Number(event[key] ?? 0);
  event[key] = clamp(current + delta, min, max);
  renderSoundEvents();
}

function updateSoundEventFrame(eventId, delta) {
  const event = effectData.soundEvents.find((item) => item.id === eventId);
  if (!event) return;

  event.frame = clamp(Number(event.frame ?? 0) + delta, 0, TOTAL_FRAMES - 1);

  effectData.soundEvents.sort((a, b) => {
    if (a.frame !== b.frame) return a.frame - b.frame;
    return String(a.relativePath || "").localeCompare(String(b.relativePath || ""), "ja");
  });

  renderSoundEvents();
}

function buildPlaybackRateFromPitch(pitch) {
  return clamp(Number(pitch || 100) / 100, 0.5, 2.0);
}

function buildVolumeGain(volume) {
  return clamp(Number(volume || 0) / 100, 0, 1);
}

async function playSoundFile(file, options = {}) {
  if (!file) {
    alert("元ファイルが見つかりません");
    return;
  }

  const audio = new Audio(URL.createObjectURL(file));
  audio.volume = buildVolumeGain(options.volume ?? 90);
  audio.playbackRate = buildPlaybackRateFromPitch(options.pitch ?? 100);

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  let audioContext = null;
  let sourceNode = null;
  let panNode = null;

  try {
    if (AudioContextClass) {
      audioContext = new AudioContextClass();
      sourceNode = audioContext.createMediaElementSource(audio);

      if (typeof audioContext.createStereoPanner === "function") {
        panNode = audioContext.createStereoPanner();
        panNode.pan.value = clamp(Number(options.pan ?? 0) / 100, -1, 1);
        sourceNode.connect(panNode);
        panNode.connect(audioContext.destination);
      } else {
        sourceNode.connect(audioContext.destination);
      }

      if (audioContext.state === "suspended") {
        await audioContext.resume();
      }
    }

    await audio.play();
  } catch (err) {
    console.error("audio play failed", err);
    alert("再生できませんでした");
  } finally {
    audio.addEventListener("ended", async () => {
      URL.revokeObjectURL(audio.src);
      if (audioContext) {
        try {
          await audioContext.close();
        } catch (_) {
        }
      }
    }, { once: true });
  }
}

function previewSelectedSound() {
  const sound = getSelectedSound();
  if (!sound) {
    alert("効果音を選んでください");
    return;
  }
  playSoundFile(sound.file, { volume: 90, pitch: 100, pan: 0 });
}

function previewSoundEvent(event) {
  const sound =
    soundFiles.find((item) => item.id === event.soundId) ||
    soundFiles.find((item) => item.relativePath === event.relativePath) ||
    soundFiles.find((item) => item.name === event.name) ||
    null;

  if (!sound) {
    alert("この効果音は今の情報源にありません");
    return;
  }

  event.soundId = sound.id;
  event.name = sound.name;
  event.relativePath = sound.relativePath;

  playSoundFile(sound.file, event);
  renderSoundEvents();
}

function playSoundEventsAtFrame(frame) {
  const events = Array.isArray(effectData.soundEvents) ? effectData.soundEvents : [];
  const targets = events.filter((event) => Number(event.frame) === Number(frame));

  targets.forEach((event) => {
    const sound =
      soundFiles.find((item) => item.id === event.soundId) ||
      soundFiles.find((item) => item.relativePath === event.relativePath) ||
      soundFiles.find((item) => item.name === event.name) ||
      null;

    if (!sound || !sound.file) return;

    event.soundId = sound.id;
    event.name = sound.name;
    event.relativePath = sound.relativePath;

    playSoundFile(sound.file, event);
  });
}

const SOUND_DIR_DB_NAME = "effectToolDb";
const SOUND_DIR_STORE_NAME = "kv";
const SOUND_DIR_KEY = "soundDirectoryHandle";

function openSoundDirDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(SOUND_DIR_DB_NAME, 1);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SOUND_DIR_STORE_NAME)) {
        db.createObjectStore(SOUND_DIR_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

async function saveSoundDirectoryHandle(handle) {
  if (!handle) return;

  try {
    const db = await openSoundDirDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(SOUND_DIR_STORE_NAME, "readwrite");
      const store = tx.objectStore(SOUND_DIR_STORE_NAME);
      const req = store.put(handle, SOUND_DIR_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch (err) {
    console.error("saveSoundDirectoryHandle failed", err);
  }
}

async function loadSavedSoundDirectoryHandle() {
  try {
    const db = await openSoundDirDb();
    const handle = await new Promise((resolve, reject) => {
      const tx = db.transaction(SOUND_DIR_STORE_NAME, "readonly");
      const store = tx.objectStore(SOUND_DIR_STORE_NAME);
      const req = store.get(SOUND_DIR_KEY);

      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return handle;
  } catch (err) {
    console.error("loadSavedSoundDirectoryHandle failed", err);
    return null;
  }
}

async function clearSavedSoundDirectoryHandle() {
  try {
    const db = await openSoundDirDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(SOUND_DIR_STORE_NAME, "readwrite");
      const store = tx.objectStore(SOUND_DIR_STORE_NAME);
      const req = store.delete(SOUND_DIR_KEY);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    db.close();
  } catch (err) {
    console.error("clearSavedSoundDirectoryHandle failed", err);
  }
}

async function getDirectoryPermission(handle) {
  if (!handle) return false;

  try {
    const read = await handle.queryPermission({ mode: "read" });
    if (read === "granted") return true;

    const requested = await handle.requestPermission({ mode: "read" });
    return requested === "granted";
  } catch (err) {
    console.error("getDirectoryPermission failed", err);
    return false;
  }
}

async function loadFilesFromDirectoryHandle(dirHandle) {
  const files = [];

  async function walkDirectory(handle, prefix = "") {
    for await (const [name, entry] of handle.entries()) {
      if (entry.kind === "file") {
        const file = await entry.getFile();
        try {
          Object.defineProperty(file, "webkitRelativePath", {
            value: prefix ? `${prefix}/${name}` : name,
            configurable: true
          });
        } catch (_) {
        }
        files.push(file);
      } else if (entry.kind === "directory") {
        await walkDirectory(entry, prefix ? `${prefix}/${name}` : name);
      }
    }
  }

  await walkDirectory(dirHandle, "");
  return files;
}

async function reconnectSavedSoundFolder() {
  if (typeof window.showDirectoryPicker !== "function") {
    alert("この環境では前回フォルダ再接続に対応していません");
    return;
  }

  const savedHandle = await loadSavedSoundDirectoryHandle();
  if (!savedHandle) {
    alert("記憶されたフォルダはありません");
    return;
  }

  const ok = await getDirectoryPermission(savedHandle);
  if (!ok) {
    alert("前回フォルダへのアクセスが許可されませんでした");
    return;
  }

  try {
    const files = await loadFilesFromDirectoryHandle(savedHandle);
    currentSoundDirectoryHandle = savedHandle;
    await saveSoundDirectoryHandle(savedHandle);
    addSoundFiles(files, savedHandle.name || "folder");
  } catch (err) {
    console.error("reconnectSavedSoundFolder failed", err);
    alert("前回フォルダの再接続に失敗しました");
  }
}

async function pickSoundFolder() {
  if (typeof window.showDirectoryPicker === "function") {
    try {
      const dirHandle = await window.showDirectoryPicker();
      const ok = await getDirectoryPermission(dirHandle);

      if (!ok) {
        alert("フォルダへのアクセスが許可されませんでした");
        return;
      }

      const files = await loadFilesFromDirectoryHandle(dirHandle);
      currentSoundDirectoryHandle = dirHandle;
      await saveSoundDirectoryHandle(dirHandle);
      addSoundFiles(files, dirHandle.name || "folder");
      return;
    } catch (err) {
      if (err?.name === "AbortError") return;
      console.error("directory picker failed", err);
    }
  }

  soundFolderInput.click();
}

function updateButtonHighlights() {
  const state = getSelectedState();

  document.querySelectorAll(".shape-controls button").forEach((btn) => {
    const map = {
      "四角": "square",
      "丸": "circle",
      "三角": "triangle"
    };
    btn.classList.toggle("active", map[btn.textContent] === state.shape);
  });

  document.querySelectorAll(".color-controls button").forEach((btn) => {
    const map = {
      "シアン": "cyan",
      "赤": "red",
      "黄": "yellow",
      "緑": "lime",
      "白": "white",
      "紫": "magenta"
    };
    btn.classList.toggle("active", map[btn.textContent] === state.color);
  });

  document.querySelectorAll(".move-mode-controls button").forEach((btn) => {
    const map = {
      "手動": "manual",
      "通常": "normal",
      "DNA": "dna",
      "螺旋": "spiral"
    };
    btn.classList.toggle("active", map[btn.textContent] === state.moveMode);
  });

  startPathBtn.classList.toggle("active", isPathMode);
}

function renderInspector() {
  const obj = getSelectedObject();
  const state = getSelectedState();

  startFrameValue.textContent = obj.startFrame;
  endFrameValue.textContent = obj.endFrame;

  opacityValue.textContent = state.opacity.toFixed(1);
  dxValue.textContent = state.dx;
  dyValue.textContent = state.dy;
  dSizeValue.textContent = state.dSize;
  dOpacityValue.textContent = state.dOpacity.toFixed(1);
  rotationValue.textContent = state.rotation;
  dRotationValue.textContent = state.dRotation;
  moveModeText.textContent = `mode: ${state.moveMode}`;
  waveAmpValue.textContent = state.waveAmp;
  waveSpeedValue.textContent = state.waveSpeed.toFixed(1);
  radiusStepValue.textContent = state.radiusStep;
  rotateSpeedValue.textContent = state.rotateSpeed.toFixed(1);
  trailFadeValue.textContent = trailFade.toFixed(2);
  trailDensityValue.textContent = trailDensity;
auraEnabledValue.textContent = state.auraEnabled ? "ON" : "OFF";
auraSizeValue.textContent = state.auraSize;
auraAlphaValue.textContent = state.auraAlpha.toFixed(2);
thinValue.textContent = state.thinX.toFixed(1);

  if (isPathMode) {
    pathStatusText.textContent = drawnPath.length >= 2 ? `記録点数: ${drawnPath.length}` : "プレビュー上をなぞってください";
  } else {
    pathStatusText.textContent = "待機中";
  }

  stateText.textContent =
    `object:${obj.name}, frame:${currentFrame}, start:${obj.startFrame}, end:${obj.endFrame}, x:${state.x}, y:${state.y}, size:${state.size}, shape:${state.shape}, color:${state.color}, opacity:${state.opacity.toFixed(1)}, rotation:${state.rotation}, mode:${state.moveMode}, dx:${state.dx}, dy:${state.dy}, dSize:${state.dSize}, dOpacity:${state.dOpacity.toFixed(1)}, dRotation:${state.dRotation}, waveAmp:${state.waveAmp}, waveSpeed:${state.waveSpeed.toFixed(1)}, radiusStep:${state.radiusStep}, rotateSpeed:${state.rotateSpeed.toFixed(1)}, aura:${state.auraEnabled ? "on" : "off"}, auraSize:${state.auraSize}, auraAlpha:${state.auraAlpha.toFixed(2)}, thinX:${state.thinX.toFixed(1)}`;
}

function render() {
  frameSlider.value = currentFrame;
  frameLabel.textContent = currentFrame;
  drawHint.style.display = isPathMode ? "block" : "none";
  renderPreview();
  renderObjectList();
  renderSoundSource();
  renderSoundEvents();
  renderInspector();
  updateButtonHighlights();
  redrawPathCanvas();
}

function propagateCurrentValueToFuture(key, value) {
  const obj = getSelectedObject();
  for (let i = currentFrame; i < TOTAL_FRAMES; i++) {
    obj.frames[i][key] = value;
  }
}

function moveBox(dx, dy) {
  const state = getSelectedState();
  state.x += dx;
  state.y += dy;
  render();
}

function resizeBox(ds) {
  const state = getSelectedState();
  const newSize = Math.max(10, state.size + ds);
  propagateCurrentValueToFuture("size", newSize);

  const obj = getSelectedObject();
  if (Array.isArray(obj.pathPoints) && obj.pathPoints.length >= 2) {
    bakePathToObject(obj);
  }

  render();
}

function setShape(shape) {
  propagateCurrentValueToFuture("shape", shape);
  render();
}

function setColor(color) {
  propagateCurrentValueToFuture("color", color);
  render();
}

function changeOpacity(delta) {
  const state = getSelectedState();
  const newOpacity = clamp(round1(state.opacity + delta), 0, 1);
  propagateCurrentValueToFuture("opacity", newOpacity);

  const obj = getSelectedObject();
  if (Array.isArray(obj.pathPoints) && obj.pathPoints.length >= 2) {
    bakePathToObject(obj);
  }

  render();
}

function changeRotation(delta) {
  const state = getSelectedState();
  const newRotation = state.rotation + delta;
  propagateCurrentValueToFuture("rotation", newRotation);

  const obj = getSelectedObject();
  if (Array.isArray(obj.pathPoints) && obj.pathPoints.length >= 2) {
    bakePathToObject(obj);
  }

  render();
}

function setMoveMode(mode) {
  getSelectedState().moveMode = mode;
  render();
}

function changeDelta(key, delta) {
  const state = getSelectedState();
  let newValue;

  if (key === "dOpacity") {
    newValue = clamp(round1(state[key] + delta), -1, 1);
  } else {
    newValue = state[key] + delta;
  }

  propagateCurrentValueToFuture(key, newValue);

  const obj = getSelectedObject();
  if (Array.isArray(obj.pathPoints) && obj.pathPoints.length >= 2) {
    bakePathToObject(obj);
  }

  render();
}

function changeParam(key, delta) {
  const state = getSelectedState();
  if (key === "waveSpeed" || key === "rotateSpeed") {
    state[key] = round1(state[key] + delta);
  } else {
    state[key] += delta;
  }
  render();
}

function changeTrailFade(delta) {
  trailFade = clamp(round2(trailFade + delta), 0.01, 1);
  render();
}

function changeTrailDensity(delta) {
  trailDensity = clamp(trailDensity + delta, 0, 12);
  render();
}
function toggleAura() {
  const state = getSelectedState();
  const nextValue = !state.auraEnabled;
  propagateCurrentValueToFuture("auraEnabled", nextValue);
  render();
}

function changeAuraSize(delta) {
  const state = getSelectedState();
  const nextValue = Math.max(0, state.auraSize + delta);
  propagateCurrentValueToFuture("auraSize", nextValue);
  render();
}

function changeAuraAlpha(delta) {
  const state = getSelectedState();
  const nextValue = clamp(round2(state.auraAlpha + delta), 0, 1);
  propagateCurrentValueToFuture("auraAlpha", nextValue);
  render();
}

function changeThinX(delta) {
  const state = getSelectedState();
  const nextValue = clamp(round1(state.thinX + delta), 0.2, 2.0);
  propagateCurrentValueToFuture("thinX", nextValue);
  render();
}

function changeObjectRange(key, delta) {
  const obj = getSelectedObject();
  obj[key] = clamp(obj[key] + delta, 0, TOTAL_FRAMES - 1);

  if (obj.startFrame > obj.endFrame) {
    if (key === "startFrame") {
      obj.endFrame = obj.startFrame;
    } else {
      obj.startFrame = obj.endFrame;
    }
  }

  if (Array.isArray(obj.pathPoints) && obj.pathPoints.length >= 2) {
    bakePathToObject(obj);
  }

  render();
}

function setFrame(frame) {
  currentFrame = clamp(frame, 0, TOTAL_FRAMES - 1);
  if (!playTimer) {
    lastPlayedSoundFrame = -1;
  }
  render();
}

function copyPreviousFrame() {
  if (currentFrame <= 0) return;
  const obj = getSelectedObject();
  obj.frames[currentFrame] = cloneFrame(obj.frames[currentFrame - 1]);
  render();
}

function makeNextFrameForObject(obj, frameIndex) {
  if (frameIndex >= TOTAL_FRAMES - 1) return;

  const s = obj.frames[frameIndex];
  const next = cloneFrame(s);

  if (frameIndex < obj.startFrame) {
    obj.frames[frameIndex + 1] = cloneFrame(s);
    return;
  }

  if (frameIndex >= obj.endFrame) {
    obj.frames[frameIndex + 1] = cloneFrame(s);
    return;
  }

  if (s.moveMode === "manual") {
    obj.frames[frameIndex + 1] = cloneFrame(obj.frames[frameIndex + 1] ?? s);
    return;
  }

  if (s.moveMode === "normal") {
    next.x = s.x + s.dx;
    next.y = s.y + s.dy;
  } else if (s.moveMode === "dna") {
    const baseX = s.x + s.dx;
    const baseY = s.y + s.dy;
    const len = Math.hypot(s.dx, s.dy) || 1;
    const nx = -s.dy / len;
    const ny = s.dx / len;

    next.spiralAngle = s.spiralAngle + s.waveSpeed;
    const wave = Math.sin(next.spiralAngle) * s.waveAmp;

    next.x = Math.round(baseX + nx * wave);
    next.y = Math.round(baseY + ny * wave);
  } else if (s.moveMode === "spiral") {
    next.spiralAngle = s.spiralAngle + s.rotateSpeed;
    next.spiralRadius = s.spiralRadius + s.radiusStep;
    next.x = Math.round(s.x + Math.cos(next.spiralAngle) * next.spiralRadius);
    next.y = Math.round(s.y + Math.sin(next.spiralAngle) * next.spiralRadius);
  }

  next.size = Math.max(10, s.size + s.dSize);
  next.opacity = clamp(round1(s.opacity + s.dOpacity), 0, 1);
  next.rotation = s.rotation + s.dRotation;

  obj.frames[frameIndex + 1] = next;
}

function makeNextFrameForAllObjects() {
  effectData.objects.forEach((obj) => {
    makeNextFrameForObject(obj, currentFrame);
  });
}

function stopPlayback() {
  if (playTimer) {
    clearInterval(playTimer);
    playTimer = null;
  }
  lastPlayedSoundFrame = -1;
  playBtn.textContent = "再生";
}

function playTimeline() {
  if (playTimer) {
    stopPlayback();
    return;
  }

  clearTrails();
  lastPlayedSoundFrame = -1;
  playBtn.textContent = "停止";

  playTimer = setInterval(() => {
    updateTrails();

    const beforeStates = effectData.objects.map((obj) => cloneFrame(obj.frames[currentFrame]));

    if (lastPlayedSoundFrame !== currentFrame) {
      playSoundEventsAtFrame(currentFrame);
      lastPlayedSoundFrame = currentFrame;
    }

    if (currentFrame >= TOTAL_FRAMES - 1) {
      stopPlayback();
      currentFrame = 0;
      render();
      return;
    }

    makeNextFrameForAllObjects();
    currentFrame++;

    effectData.objects.forEach((obj, index) => {
      if (!isVisibleAtFrame(obj, currentFrame - 1) && !isVisibleAtFrame(obj, currentFrame)) {
        return;
      }
      const afterState = obj.frames[currentFrame];
      addTrailBetween(beforeStates[index], afterState);
    });

    render();
  }, FRAME_INTERVAL_MS);
}

function buildExportData() {
  return {
    name: effectNameInput.value.trim() || "effect_01",
    effectKey: effectKeyInput.value.trim() || "effect_01",
    frameRate: FRAME_RATE,
    duration: effectData.duration,
    coordinateMode: coordinateModeSelect.value || "target",
    editorCenterX: 140,
    editorCenterY: 140,
    sourceX: Number(sourceXInput.value || 20),
    targetX: Number(targetXInput.value || 200),
    objects: effectData.objects,
    soundEvents: effectData.soundEvents || []
  };
}

function exportJson() {
  jsonArea.value = JSON.stringify(buildExportData(), null, 2);
}

async function downloadJsonFile() {
  const data = buildExportData();
  const jsonText = JSON.stringify(data, null, 2);
  const safeName = (data.name || "effect_01")
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim() || "effect_01";

  jsonArea.value = jsonText;

  if (typeof window.showSaveFilePicker !== "function") {
    downloadTextWithBrowser(safeName + ".json", jsonText);
    return;
  }

  try {
    const handle = await window.showSaveFilePicker({
      suggestedName: safeName + ".json",
      types: [
        {
          description: "JSON file",
          accept: {
            "application/json": [".json"]
          }
        }
      ]
    });

    const writable = await handle.createWritable();
    await writable.write(jsonText);
    await writable.close();

    alert("保存しました");
  } catch (err) {
    console.error("save picker failed", err, err?.name, err?.message);
    if (err?.name === "AbortError") {
      alert("保存がキャンセルされました");
      return;
    }
    alert("保存に失敗しました");
  }
}

function downloadTextWithBrowser(fileName, text) {
  const blob = new Blob([text], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function updateMzLibraryStatus() {
  const count = Object.keys(mzLibrary).length;
  mzLibraryStatusText.textContent = `MZライブラリ: ${count}件`;
}

function loadMzLibraryFile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(String(reader.result || ""));
      if (!parsed || Array.isArray(parsed) || typeof parsed !== "object" || Array.isArray(parsed.objects)) {
        throw new Error("JsonEffects.json形式ではありません");
      }
      mzLibrary = parsed;
      updateMzLibraryStatus();

      const keys = Object.keys(mzLibrary);
      const requestedKey = effectKeyInput.value.trim();
      const key = mzLibrary[requestedKey] ? requestedKey : keys[0];
      if (key && mzLibrary[key]) {
        jsonArea.value = JSON.stringify(mzLibrary[key], null, 2);
        importJson();
        effectKeyInput.value = key;
      }
    } catch (err) {
      alert("MZライブラリ読込失敗: " + err.message);
    }
  };
  reader.readAsText(file, "utf-8");
}

function saveMzLibrary() {
  const key = effectKeyInput.value.trim();
  if (!key || key.includes("]")) {
    alert("JFX keyを入力してください（] は使用できません）");
    return;
  }

  mzLibrary[key] = buildExportData();
  const jsonText = JSON.stringify(mzLibrary, null, 2);
  jsonArea.value = jsonText;
  updateMzLibraryStatus();
  downloadTextWithBrowser("JsonEffects.json", jsonText);
}

function loadJsonFromFile(file) {
  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    try {
      const text = String(reader.result || "");
      jsonArea.value = text;

      const parsed = JSON.parse(text);
      const normalized = normalizeImportedData(parsed);

effectData.duration = TOTAL_FRAMES;
effectData.objects = normalized.objects;
effectData.soundEvents = normalized.soundEvents || [];
      selectedObjectIndex = 0;
      currentFrame = 0;
      exitPathMode();
      clearTrails();

      if (typeof parsed.name === "string" && parsed.name.trim()) {
        effectNameInput.value = parsed.name.trim();
      }
      if (typeof parsed.effectKey === "string" && parsed.effectKey.trim()) {
        effectKeyInput.value = parsed.effectKey.trim();
      }
      coordinateModeSelect.value = parsed.coordinateMode === "sourceToTarget"
        ? "sourceToTarget"
        : "target";
      sourceXInput.value = String(Number(parsed.sourceX ?? 20));
      targetXInput.value = String(Number(parsed.targetX ?? 200));

      render();
    } catch (err) {
      alert("ファイル読込失敗: " + err.message);
    }
  };

  reader.onerror = () => {
    alert("ファイルを読み込めませんでした");
  };

  reader.readAsText(file, "utf-8");
}

function normalizeImportedData(data) {
  const result = {
    duration: TOTAL_FRAMES,
    objects: [],
    soundEvents: []
  };

  if (!data || !Array.isArray(data.objects)) {
    throw new Error("objects がありません");
  }

  data.objects.forEach((obj, index) => {
    const newObj = createObject(obj.name || `obj${index + 1}`);
    newObj.id = typeof obj.id === "number" ? obj.id : (Date.now() + index);
    newObj.startFrame = clamp(Number(obj.startFrame ?? 0), 0, TOTAL_FRAMES - 1);
    newObj.endFrame = clamp(Number(obj.endFrame ?? (TOTAL_FRAMES - 1)), 0, TOTAL_FRAMES - 1);
    newObj.pathPoints = Array.isArray(obj.pathPoints) ? obj.pathPoints : null;

    if (newObj.startFrame > newObj.endFrame) {
      newObj.endFrame = newObj.startFrame;
    }

    if (Array.isArray(obj.frames)) {
      for (let i = 0; i < TOTAL_FRAMES; i++) {
        const src = obj.frames[i];
        if (!src) continue;
        newObj.frames[i] = {
          ...createDefaultFrame(),
          ...src
        };
      }
    }

    result.objects.push(newObj);
  });

  if (Array.isArray(data.soundEvents)) {
    result.soundEvents = data.soundEvents.map((event, index) => ({
      id: Number(event.id ?? (Date.now() + index)),
      frame: clamp(Number(event.frame ?? 0), 0, TOTAL_FRAMES - 1),
      soundId: event.soundId ?? "",
      name: event.name || "",
      relativePath: event.relativePath || event.name || `sound_${index + 1}`,
      volume: clamp(Number(event.volume ?? 90), 0, 100),
      pitch: clamp(Number(event.pitch ?? 100), 50, 200),
      pan: clamp(Number(event.pan ?? 0), -100, 100)
    }));
  }

  if (result.objects.length === 0) {
    result.objects.push(createObject("obj1"));
  }

  return result;
}

function importJson() {
  try {
    const parsed = JSON.parse(jsonArea.value);
    const normalized = normalizeImportedData(parsed);

effectData.duration = TOTAL_FRAMES;
effectData.objects = normalized.objects;
effectData.soundEvents = normalized.soundEvents || [];
    selectedObjectIndex = 0;
    currentFrame = 0;
    exitPathMode();
    clearTrails();

    if (typeof parsed.name === "string" && parsed.name.trim()) {
      effectNameInput.value = parsed.name.trim();
    }
    if (typeof parsed.effectKey === "string" && parsed.effectKey.trim()) {
      effectKeyInput.value = parsed.effectKey.trim();
    }
    coordinateModeSelect.value = parsed.coordinateMode === "sourceToTarget"
      ? "sourceToTarget"
      : "target";
    sourceXInput.value = String(Number(parsed.sourceX ?? 20));
    targetXInput.value = String(Number(parsed.targetX ?? 200));

    render();
  } catch (err) {
    alert("JSON読込失敗: " + err.message);
  }
}

function addObject() {
  const name = `obj${effectData.objects.length + 1}`;
  effectData.objects.push(createObject(name));
  selectedObjectIndex = effectData.objects.length - 1;
  render();
}

function duplicateObject() {
  const src = getSelectedObject();

  const copy = {
    id: Date.now() + Math.floor(Math.random() * 100000),
    name: src.name + "_copy",
    startFrame: src.startFrame,
    endFrame: src.endFrame,
    pathPoints: Array.isArray(src.pathPoints)
      ? src.pathPoints.map((p) => ({ x: p.x, y: p.y }))
      : null,
    frames: src.frames.map((frame) => cloneFrame(frame))
  };

  effectData.objects.push(copy);
  selectedObjectIndex = effectData.objects.length - 1;
  render();
}

function renameObject() {
  const obj = getSelectedObject();
  const value = prompt("新しい名前", obj.name);
  if (value && value.trim()) {
    obj.name = value.trim();
    render();
  }
}

function deleteObject() {
  if (effectData.objects.length <= 1) {
    alert("最後の1個は削除できません");
    return;
  }
  effectData.objects.splice(selectedObjectIndex, 1);
  selectedObjectIndex = clamp(selectedObjectIndex, 0, effectData.objects.length - 1);
  render();
}

function enterPathMode() {
  isPathMode = true;
  isDrawing = false;
  drawnPath = [];
  render();
}

function exitPathMode() {
  isPathMode = false;
  isDrawing = false;
  drawnPath = [];
  render();
}

function getPreviewPointFromEvent(e) {
  const rect = preview.getBoundingClientRect();
  return {
    x: clamp(e.clientX - rect.left, 0, rect.width),
    y: clamp(e.clientY - rect.top, 0, rect.height)
  };
}

function simplifyPath(points, minDist = 4) {
  if (points.length <= 1) return points.slice();

  const result = [points[0]];
  let last = points[0];

  for (let i = 1; i < points.length; i++) {
    const p = points[i];
    const dx = p.x - last.x;
    const dy = p.y - last.y;
    if (Math.hypot(dx, dy) >= minDist) {
      result.push(p);
      last = p;
    }
  }

  if (result[result.length - 1] !== points[points.length - 1]) {
    result.push(points[points.length - 1]);
  }

  return result;
}

function smoothPath(points, iterations = 2) {
  if (!points || points.length < 3) return points ? points.slice() : [];

  let result = points.slice();

  for (let k = 0; k < iterations; k++) {
    if (result.length < 3) break;

    const next = [result[0]];

    for (let i = 0; i < result.length - 1; i++) {
      const p0 = result[i];
      const p1 = result[i + 1];

      const q = {
        x: 0.75 * p0.x + 0.25 * p1.x,
        y: 0.75 * p0.y + 0.25 * p1.y
      };

      const r = {
        x: 0.25 * p0.x + 0.75 * p1.x,
        y: 0.25 * p0.y + 0.75 * p1.y
      };

      next.push(q, r);
    }

    next.push(result[result.length - 1]);
    result = next;
  }

  return result;
}

function resamplePath(points, count) {
  if (points.length === 0) return [];
  if (points.length === 1) {
    return Array.from({ length: count }, () => ({ x: points[0].x, y: points[0].y }));
  }

  const lengths = [0];
  let total = 0;

  for (let i = 1; i < points.length; i++) {
    const seg = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    total += seg;
    lengths.push(total);
  }

  if (total === 0) {
    return Array.from({ length: count }, () => ({ x: points[0].x, y: points[0].y }));
  }

  const result = [];

  for (let i = 0; i < count; i++) {
    const target = count === 1 ? 0 : (total * i) / (count - 1);

    let segIndex = 0;
    while (segIndex < lengths.length - 1 && lengths[segIndex + 1] < target) {
      segIndex++;
    }

    const p1 = points[segIndex];
    const p2 = points[Math.min(segIndex + 1, points.length - 1)];
    const l1 = lengths[segIndex];
    const l2 = lengths[Math.min(segIndex + 1, lengths.length - 1)];
    const t = l2 === l1 ? 0 : (target - l1) / (l2 - l1);

    result.push({
      x: Math.round(p1.x + (p2.x - p1.x) * t),
      y: Math.round(p1.y + (p2.y - p1.y) * t)
    });
  }

  return result;
}

function bakePathToObject(obj) {
  if (!Array.isArray(obj.pathPoints) || obj.pathPoints.length < 2) return;

  const frameCount = obj.endFrame - obj.startFrame + 1;
  if (frameCount <= 0) return;

  const sampled = resamplePath(obj.pathPoints, frameCount);

  const baseFrame = cloneFrame(obj.frames[obj.startFrame]);
  const baseSize = baseFrame.size;
  const baseOpacity = baseFrame.opacity;
  const baseRotation = baseFrame.rotation;
  const dSize = baseFrame.dSize;
  const dOpacity = baseFrame.dOpacity;
  const dRotation = baseFrame.dRotation;

  // startFrame より前は最初の点で固定
  for (let i = 0; i < obj.startFrame; i++) {
    const state = obj.frames[i];
    state.x = sampled[0].x;
    state.y = sampled[0].y;
    state.moveMode = "manual";
    state.dx = 0;
    state.dy = 0;
    state.spiralAngle = 0;
    state.spiralRadius = 10;
  }

  // startFrame ～ endFrame に軌道を焼く
  for (let i = 0; i < frameCount; i++) {
    const frameIndex = obj.startFrame + i;
    const state = obj.frames[frameIndex];

    state.x = sampled[i].x;
    state.y = sampled[i].y;

    state.size = Math.max(10, baseSize + dSize * i);
    state.opacity = clamp(round1(baseOpacity + dOpacity * i), 0, 1);
    state.rotation = baseRotation + dRotation * i;

    state.moveMode = "manual";
    state.dx = 0;
    state.dy = 0;
    state.spiralAngle = 0;
    state.spiralRadius = 10;
  }

  // endFrame より後は最後の点・最後の見た目で固定
  const lastIndex = obj.endFrame;
  const lastState = obj.frames[lastIndex];

  for (let i = obj.endFrame + 1; i < TOTAL_FRAMES; i++) {
    const state = obj.frames[i];
    state.x = lastState.x;
    state.y = lastState.y;
    state.size = lastState.size;
    state.opacity = lastState.opacity;
    state.rotation = lastState.rotation;
    state.moveMode = "manual";
    state.dx = 0;
    state.dy = 0;
    state.spiralAngle = 0;
    state.spiralRadius = 10;
  }
}

function applyDrawnPathToSelectedObject() {
  const obj = getSelectedObject();

  if (drawnPath.length < 2) {
    alert("軌道が短すぎます");
    return;
  }

 const simplified = simplifyPath(drawnPath, 3);
const smoothed = smoothPath(simplified, 2);
obj.pathPoints = smoothed.map((p) => ({ x: Math.round(p.x), y: Math.round(p.y) }));

  bakePathToObject(obj);
  exitPathMode();
}

function handlePointerDown(e) {
  if (!isPathMode) return;
  e.preventDefault();

  isDrawing = true;
  drawnPath = [getPreviewPointFromEvent(e)];
  redrawPathCanvas();
  renderInspector();
}

function handlePointerMove(e) {
  if (!isPathMode || !isDrawing) return;
  e.preventDefault();
  drawnPath.push(getPreviewPointFromEvent(e));
  redrawPathCanvas();
  renderInspector();
}

function handlePointerUp(e) {
  if (!isPathMode) return;
  e.preventDefault();
  isDrawing = false;
  renderInspector();
}

frameSlider.addEventListener("input", (e) => {
  setFrame(Number(e.target.value));
});

prevFrameBtn.addEventListener("click", () => {
  setFrame(currentFrame - 1);
});

nextFrameBtn.addEventListener("click", () => {
  if (currentFrame < TOTAL_FRAMES - 1) {
    makeNextFrameForAllObjects();
  }
  setFrame(currentFrame + 1);
});

copyPrevBtn.addEventListener("click", () => {
  copyPreviousFrame();
});

playBtn.addEventListener("click", () => {
  playTimeline();
});

addObjectBtn.addEventListener("click", () => {
  addObject();
});

renameObjectBtn.addEventListener("click", () => {
  renameObject();
});

deleteObjectBtn.addEventListener("click", () => {
  deleteObject();
});

exportJsonBtn.addEventListener("click", () => {
  exportJson();
});

importJsonBtn.addEventListener("click", () => {
  importJson();
});

startPathBtn.addEventListener("click", () => {
  enterPathMode();
});

applyPathBtn.addEventListener("click", () => {
  applyDrawnPathToSelectedObject();
});
duplicateObjectBtn.addEventListener("click", () => {
  duplicateObject();
});

cancelPathBtn.addEventListener("click", () => {
  exitPathMode();
});

preview.addEventListener("pointerdown", handlePointerDown);
preview.addEventListener("pointermove", handlePointerMove);
preview.addEventListener("pointerup", handlePointerUp);
preview.addEventListener("pointercancel", handlePointerUp);
preview.addEventListener("pointerleave", handlePointerUp);
downloadJsonBtn.addEventListener("click", () => {
  downloadJsonFile();
});

loadJsonFileBtn.addEventListener("click", () => {
  jsonFileInput.click();
});

loadMzLibraryBtn.addEventListener("click", () => {
  mzLibraryFileInput.click();
});

mzLibraryFileInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  loadMzLibraryFile(file);
  e.target.value = "";
});

saveMzLibraryBtn.addEventListener("click", () => {
  saveMzLibrary();
});

jsonFileInput.addEventListener("change", (e) => {
  const file = e.target.files && e.target.files[0];
  loadJsonFromFile(file);
  e.target.value = "";
});

pickSoundFolderBtn.addEventListener("click", () => {
  pickSoundFolder();
});

reconnectSoundFolderBtn.addEventListener("click", () => {
  reconnectSavedSoundFolder();
});

soundSelect.addEventListener("change", (e) => {
  selectedSoundId = String(e.target.value || "");
  renderSoundSource();
});

previewSoundBtn.addEventListener("click", () => {
  previewSelectedSound();
});

addSoundEventBtn.addEventListener("click", () => {
  addSoundEventAtCurrentFrame();
});

pickSoundFilesBtn.addEventListener("click", () => {
  soundFilesInput.click();
});

clearSoundSourceBtn.addEventListener("click", () => {
  clearSoundSource();
});

soundFilesInput.addEventListener("change", (e) => {
  addSoundFiles(e.target.files, "files");
  e.target.value = "";
});

soundFolderInput.addEventListener("change", (e) => {
  const files = e.target.files;
  const sourceLabel =
    files && files[0] && files[0].webkitRelativePath
      ? files[0].webkitRelativePath.split("/")[0]
      : "folder";

  currentSoundDirectoryHandle = null;
  addSoundFiles(files, sourceLabel);
  e.target.value = "";
});

window.addEventListener("resize", resizeCanvasToPreview);

bindRepeatButton(document.getElementById("startFrameDownBtn"), () => changeObjectRange("startFrame", -1));
bindRepeatButton(document.getElementById("startFrameUpBtn"), () => changeObjectRange("startFrame", 1));
bindRepeatButton(document.getElementById("endFrameDownBtn"), () => changeObjectRange("endFrame", -1));
bindRepeatButton(document.getElementById("endFrameUpBtn"), () => changeObjectRange("endFrame", 1));

bindRepeatButton(document.getElementById("moveLeftBtn"), () => moveBox(-10, 0));
bindRepeatButton(document.getElementById("moveRightBtn"), () => moveBox(10, 0));
bindRepeatButton(document.getElementById("moveUpBtn"), () => moveBox(0, -10));
bindRepeatButton(document.getElementById("moveDownBtn"), () => moveBox(0, 10));
bindRepeatButton(document.getElementById("sizeUpBtn"), () => resizeBox(10));
bindRepeatButton(document.getElementById("sizeDownBtn"), () => resizeBox(-10));

document.getElementById("shapeSquareBtn").addEventListener("click", () => setShape("square"));
document.getElementById("shapeCircleBtn").addEventListener("click", () => setShape("circle"));
document.getElementById("shapeTriangleBtn").addEventListener("click", () => setShape("triangle"));

document.getElementById("colorCyanBtn").addEventListener("click", () => setColor("cyan"));
document.getElementById("colorRedBtn").addEventListener("click", () => setColor("red"));
document.getElementById("colorYellowBtn").addEventListener("click", () => setColor("yellow"));
document.getElementById("colorLimeBtn").addEventListener("click", () => setColor("lime"));
document.getElementById("colorWhiteBtn").addEventListener("click", () => setColor("white"));
document.getElementById("colorMagentaBtn").addEventListener("click", () => setColor("magenta"));

bindRepeatButton(document.getElementById("opacityDownBtn"), () => changeOpacity(-0.1));
bindRepeatButton(document.getElementById("opacityUpBtn"), () => changeOpacity(0.1));

bindRepeatButton(document.getElementById("rotationDownBtn"), () => changeRotation(-15));
bindRepeatButton(document.getElementById("rotationUpBtn"), () => changeRotation(15));
bindRepeatButton(document.getElementById("dRotationDownBtn"), () => changeDelta("dRotation", -5));
bindRepeatButton(document.getElementById("dRotationUpBtn"), () => changeDelta("dRotation", 5));

document.getElementById("moveModeManualBtn").addEventListener("click", () => setMoveMode("manual"));
document.getElementById("moveModeNormalBtn").addEventListener("click", () => setMoveMode("normal"));
document.getElementById("moveModeDnaBtn").addEventListener("click", () => setMoveMode("dna"));
document.getElementById("moveModeSpiralBtn").addEventListener("click", () => setMoveMode("spiral"));

bindRepeatButton(document.getElementById("dxDownBtn"), () => changeDelta("dx", -1));
bindRepeatButton(document.getElementById("dxUpBtn"), () => changeDelta("dx", 1));
bindRepeatButton(document.getElementById("dyDownBtn"), () => changeDelta("dy", -1));
bindRepeatButton(document.getElementById("dyUpBtn"), () => changeDelta("dy", 1));
bindRepeatButton(document.getElementById("dSizeDownBtn"), () => changeDelta("dSize", -1));
bindRepeatButton(document.getElementById("dSizeUpBtn"), () => changeDelta("dSize", 1));
bindRepeatButton(document.getElementById("dOpacityDownBtn"), () => changeDelta("dOpacity", -0.1));
bindRepeatButton(document.getElementById("dOpacityUpBtn"), () => changeDelta("dOpacity", 0.1));

bindRepeatButton(document.getElementById("waveAmpDownBtn"), () => changeParam("waveAmp", -5));
bindRepeatButton(document.getElementById("waveAmpUpBtn"), () => changeParam("waveAmp", 5));
bindRepeatButton(document.getElementById("waveSpeedDownBtn"), () => changeParam("waveSpeed", -0.1));
bindRepeatButton(document.getElementById("waveSpeedUpBtn"), () => changeParam("waveSpeed", 0.1));
bindRepeatButton(document.getElementById("radiusStepDownBtn"), () => changeParam("radiusStep", -1));
bindRepeatButton(document.getElementById("radiusStepUpBtn"), () => changeParam("radiusStep", 1));
bindRepeatButton(document.getElementById("rotateSpeedDownBtn"), () => changeParam("rotateSpeed", -0.1));
bindRepeatButton(document.getElementById("rotateSpeedUpBtn"), () => changeParam("rotateSpeed", 0.1));

bindRepeatButton(document.getElementById("trailFadeDownBtn"), () => changeTrailFade(-0.02));
bindRepeatButton(document.getElementById("trailFadeUpBtn"), () => changeTrailFade(0.02));
bindRepeatButton(document.getElementById("trailDensityDownBtn"), () => changeTrailDensity(-1));
bindRepeatButton(document.getElementById("trailDensityUpBtn"), () => changeTrailDensity(1));
document.getElementById("auraToggleBtn").addEventListener("click", () => toggleAura());

bindRepeatButton(document.getElementById("auraSizeDownBtn"), () => changeAuraSize(-2));
bindRepeatButton(document.getElementById("auraSizeUpBtn"), () => changeAuraSize(2));

bindRepeatButton(document.getElementById("auraAlphaDownBtn"), () => changeAuraAlpha(-0.05));
bindRepeatButton(document.getElementById("auraAlphaUpBtn"), () => changeAuraAlpha(0.05));

bindRepeatButton(document.getElementById("thinDownBtn"), () => changeThinX(-0.1));
bindRepeatButton(document.getElementById("thinUpBtn"), () => changeThinX(0.1));

resizeCanvasToPreview();
render();
