/*:
 * @target MZ
 * @plugindesc v1.0 JSON Effect Toolで作成したアニメーションを再生します。
 * @author nowor
 * @param DataFile
 * @text エフェクトライブラリ
 * @desc dataフォルダ内のJSONファイル名です。
 * @type string
 * @default JsonEffects.json
 *
 * @param NamePrefix
 * @text アニメーション名の接頭辞
 * @desc [JFX:effect_key] のJFX部分です。
 * @type string
 * @default JFX
 *
 * @help
 * 【使い方】
 * 1. JSON Effect Toolでエフェクトを作成します。
 * 2. MZライブラリとして data/JsonEffects.json に保存します。
 * 3. データベースに空のアニメーションを作ります。
 * 4. 名前を [JFX:effect_key] 収束ビーム のようにします。
 * 5. スキルやアイテムのアニメーション欄で選択します。
 *
 * ライブラリにアニメーションIDと同じ数値キーがある場合は、従来の
 * ID指定としても再生できます。登録がなければMZ標準アニメーションへ
 * 自動的にフォールバックします。
 *
 * coordinateMode:
 * target         対象を中心に再生
 * sourceToTarget 使用者から対象へ向けて再生
 *
 * 効果音は audio/se に置いてください。JSON内では拡張子付きの名前や
 * フォルダ付き相対パスも使用できます。
 */

var $dataJsonEffects = null;

(() => {
    "use strict";

    const pluginName = "JsonEffectAnimationsMZ";
    const parameters = PluginManager.parameters(pluginName);
    const dataFile = String(parameters.DataFile || "JsonEffects.json");
    const namePrefix = String(parameters.NamePrefix || "JFX");
    const EDITOR_CENTER_X = 140;
    const EDITOR_CENTER_Y = 140;

    DataManager._databaseFiles.push({
        name: "$dataJsonEffects",
        src: dataFile
    });

    function effectKeyForAnimation(animation) {
        if (!animation || !animation.name) return "";
        const escaped = namePrefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const match = String(animation.name).match(new RegExp(`\\[${escaped}:([^\\]]+)\\]`, "i"));
        return match ? String(match[1] || "").trim() : "";
    }

    function effectFor(animationOrId) {
        if (!$dataJsonEffects || typeof $dataJsonEffects !== "object") return null;
        const id = typeof animationOrId === "number"
            ? animationOrId
            : Number(animationOrId && animationOrId.id);
        const key = typeof animationOrId === "object"
            ? effectKeyForAnimation(animationOrId)
            : "";
        const effect = (key && $dataJsonEffects[key]) || $dataJsonEffects[String(id)] || null;
        return effect && Array.isArray(effect.objects) ? effect : null;
    }

    function colorNumber(value) {
        const text = String(value || "#ffffff");
        if (text.startsWith("#")) {
            return Number.parseInt(text.slice(1), 16);
        }
        const named = {
            white: 0xffffff,
            cyan: 0x00ffff,
            red: 0xff3030,
            yellow: 0xffff40,
            lime: 0x40ff40,
            magenta: 0xff40ff
        };
        return named[text.toLowerCase()] ?? 0xffffff;
    }

    function soundNameForRpgMaker(event) {
        const raw = String(event?.rpgMakerName || event?.relativePath || event?.name || "");
        const fileName = raw.replace(/\\/g, "/").split("/").pop() || "";
        return fileName.replace(/\.[^.]+$/, "");
    }

    function Sprite_JsonEffectAnimation() {
        this.initialize(...arguments);
    }

    Sprite_JsonEffectAnimation.prototype = Object.create(Sprite.prototype);
    Sprite_JsonEffectAnimation.prototype.constructor = Sprite_JsonEffectAnimation;

    Sprite_JsonEffectAnimation.prototype.initialize = function() {
        Sprite.prototype.initialize.call(this);
        this._targets = [];
        this._source = null;
        this._effectData = null;
        this._frameIndex = 0;
        this._delay = 0;
        this._playing = false;
        this._objectGraphics = [];
        this._playedSoundFrames = new Set();
        this.targetObjects = [];
    };

    Sprite_JsonEffectAnimation.prototype.setup = function(targets, animation, mirror, delay, source) {
        this._targets = targets || [];
        this._source = source || null;
        this._effectData = effectFor(animation);
        this._frameIndex = 0;
        this._delay = Math.max(0, Number(delay || 0));
        this._playing = !!this._effectData;
        this.visible = this._delay <= 0;
        this.createObjectGraphics();
        this.updateOrigin();
        if (this.visible) this.renderFrame();
    };

    Sprite_JsonEffectAnimation.prototype.createObjectGraphics = function() {
        const objects = this._effectData?.objects || [];
        for (let i = 0; i < objects.length; i++) {
            const graphics = new PIXI.Graphics();
            this._objectGraphics.push(graphics);
            this.addChild(graphics);
        }
    };

    Sprite_JsonEffectAnimation.prototype.updateOrigin = function() {
        if (this._effectData?.coordinateMode === "sourceToTarget" && this._source) {
            this.x = Number(this._source.x || 0);
            this.y = Number(this._source.y || 0) - Number(this._source.height || 0) / 2;
            return;
        }

        const targets = this._targets.filter(Boolean);
        if (targets.length === 0) return;
        let x = 0;
        let y = 0;
        for (const target of targets) {
            x += Number(target.x || 0);
            y += Number(target.y || 0) - Number(target.height || 0) / 2;
        }
        this.x = x / targets.length;
        this.y = y / targets.length;
    };

    Sprite_JsonEffectAnimation.prototype.update = function() {
        Sprite.prototype.update.call(this);
        if (!this._playing) return;
        this.updateOrigin();

        if (this._delay > 0) {
            this._delay--;
            this.visible = false;
            return;
        }

        this.visible = true;
        this.playSoundsForFrame(this._frameIndex);
        this.renderFrame();
        this._frameIndex++;

        const duration = Number(this._effectData.duration || 0);
        if (this._frameIndex >= duration) {
            this._playing = false;
            this.visible = false;
        }
    };

    Sprite_JsonEffectAnimation.prototype.playSoundsForFrame = function(frame) {
        if (this._playedSoundFrames.has(frame)) return;
        this._playedSoundFrames.add(frame);
        const events = this._effectData.soundEvents || [];
        for (const event of events) {
            const name = soundNameForRpgMaker(event);
            if (Number(event.frame) !== frame || !name) continue;
            AudioManager.playSe({
                name,
                volume: Number(event.volume ?? 90),
                pitch: Number(event.pitch ?? 100),
                pan: Number(event.pan ?? 0)
            });
        }
    };

    Sprite_JsonEffectAnimation.prototype.renderFrame = function() {
        const objects = this._effectData.objects || [];
        for (let i = 0; i < objects.length; i++) {
            this.renderObject(this._objectGraphics[i], objects[i]);
        }
    };

    Sprite_JsonEffectAnimation.prototype.renderObject = function(graphics, object) {
        graphics.clear();
        const frame = this._frameIndex;
        if (frame < Number(object.startFrame || 0) || frame > Number(object.endFrame || 0)) {
            graphics.visible = false;
            return;
        }

        const state = object.frames?.[frame];
        if (!state) {
            graphics.visible = false;
            return;
        }

        graphics.visible = true;
        const position = this.effectPosition(state);
        graphics.x = position.x;
        graphics.y = position.y;
        graphics.rotation = position.rotation + Number(state.rotation || 0) * Math.PI / 180;
        graphics.scale.x = Number(state.thinX ?? 1);
        graphics.alpha = Number(state.opacity ?? 1);

        const color = colorNumber(state.color);
        if (state.auraEnabled) {
            this.drawShape(
                graphics,
                state.shape,
                Number(state.size || 0) + Number(state.auraSize || 0),
                color,
                Number(state.auraAlpha ?? 0.25)
            );
        }
        this.drawShape(graphics, state.shape, Number(state.size || 0), color, 1);
    };

    Sprite_JsonEffectAnimation.prototype.effectPosition = function(state) {
        const centerX = Number(this._effectData?.editorCenterX ?? EDITOR_CENTER_X);
        const centerY = Number(this._effectData?.editorCenterY ?? EDITOR_CENTER_Y);
        if (this._effectData?.coordinateMode !== "sourceToTarget" || !this._source) {
            return {
                x: Number(state.x || 0) - centerX,
                y: Number(state.y || 0) - centerY,
                rotation: 0
            };
        }

        const target = this._targets.find(Boolean);
        if (!target) return { x: 0, y: 0, rotation: 0 };

        const sourceX = Number(this._source.x || 0);
        const sourceY = Number(this._source.y || 0) - Number(this._source.height || 0) / 2;
        const targetX = Number(target.x || 0);
        const targetY = Number(target.y || 0) - Number(target.height || 0) / 2;
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const distance = Math.max(1, Math.hypot(dx, dy));
        const ux = dx / distance;
        const uy = dy / distance;
        const sourceAnchorX = Number(this._effectData?.sourceX ?? 20);
        const targetAnchorX = Number(this._effectData?.targetX ?? 200);
        const span = Math.abs(targetAnchorX - sourceAnchorX) < 0.001
            ? 1
            : targetAnchorX - sourceAnchorX;
        const progress = (Number(state.x ?? sourceAnchorX) - sourceAnchorX) / span;
        const perpendicular = Number(state.y ?? centerY) - centerY;

        return {
            x: dx * progress - uy * perpendicular,
            y: dy * progress + ux * perpendicular,
            rotation: Math.atan2(dy, dx)
        };
    };

    Sprite_JsonEffectAnimation.prototype.drawShape = function(graphics, shape, size, color, alpha) {
        if (size <= 0 || alpha <= 0) return;
        graphics.beginFill(color, alpha);
        if (shape === "triangle") {
            const half = size / 2;
            graphics.drawPolygon([-half, half, 0, -half, half, half]);
        } else if (shape === "square") {
            graphics.drawRect(-size / 2, -size / 2, size, size);
        } else {
            graphics.drawCircle(0, 0, size / 2);
        }
        graphics.endFill();
    };

    Sprite_JsonEffectAnimation.prototype.isPlaying = function() {
        return this._playing;
    };

    const _createAnimationSprite = Spriteset_Base.prototype.createAnimationSprite;
    Spriteset_Base.prototype.createAnimationSprite = function(targets, animation, mirror, delay) {
        const effectData = effectFor(animation);
        if (!effectData) {
            _createAnimationSprite.call(this, targets, animation, mirror, delay);
            return;
        }

        const sprite = new Sprite_JsonEffectAnimation();
        const targetSprites = this.makeTargetSprites(targets);
        let sourceSprite = null;
        if (effectData.coordinateMode === "sourceToTarget") {
            const subject = globalThis.BattleManager?._subject;
            if (subject) {
                sourceSprite = this.makeTargetSprites([subject])[0] || null;
            }
        }
        sprite.targetObjects = targets;
        sprite.setup(targetSprites, animation, mirror, delay, sourceSprite);
        this._effectsContainer.addChild(sprite);
        this._animationSprites.push(sprite);
    };

    window.JsonEffectAnimations = {
        has(animationOrId) {
            return !!effectFor(animationOrId);
        },

        keyFor(animation) {
            return effectKeyForAnimation(animation);
        },

        playOnSprites(parent, targetSprite, animationOrId, sourceSprite = null) {
            const animation = typeof animationOrId === "number"
                ? $dataAnimations[animationOrId]
                : animationOrId;
            if (!parent || !targetSprite || !animation || !effectFor(animation)) return null;

            const sprite = new Sprite_JsonEffectAnimation();
            sprite.setup([targetSprite], animation, false, 0, sourceSprite);
            parent.addChild(sprite);
            return sprite;
        },

        playOnGridScene(scene, target, animationId, source = null) {
            const animation = $dataAnimations[animationId];
            const targetSprite = scene.findBattlerSprite(target);
            const sourceSprite = source ? scene.findBattlerSprite(source) : null;
            if (!animation || !targetSprite || !effectFor(animation)) return null;

            const sprite = new Sprite_JsonEffectAnimation();
            sprite.targetObjects = [target];
            sprite.setup([targetSprite], animation, false, 0, sourceSprite);
            scene.addChild(sprite);

            const baseUpdate = sprite.update.bind(sprite);
            sprite.update = function() {
                baseUpdate();
                if (!this.isPlaying() && this.parent) {
                    this.parent.removeChild(this);
                    this.destroy({ children: true });
                }
            };
            return sprite;
        }
    };
})();
