// Installed before the engine: one output gate per AudioContext, preserving game volume settings.
export function createAudioControl(env = window) {
  let muted = true, disposed = false;
  const gates = new Map(), media = new Map();
  const node = env.AudioNode?.prototype;
  const connect = node?.connect, disconnect = node?.disconnect;
  const element = env.HTMLMediaElement?.prototype;
  const muteProperty = element && Object.getOwnPropertyDescriptor(element, "muted");
  const play = element?.play;

  if (connect && disconnect) {
    node.connect = function (destination, ...args) {
      if (destination === this.context.destination) {
        let gate = gates.get(this.context);
        if (!gate) {
          gate = this.context.createGain();
          gate.gain.value = muted || disposed ? 0 : 1;
          connect.call(gate, destination);
          gates.set(this.context, gate);
        }
        connect.call(this, gate, ...args);
        return destination;
      }
      return connect.call(this, destination, ...args);
    };
    node.disconnect = function (...args) {
      if (args[0] === this.context.destination && gates.has(this.context)) args[0] = gates.get(this.context);
      return disconnect.apply(this, args);
    };
  }

  if (muteProperty?.configurable && muteProperty.get && muteProperty.set) {
    const remember = instance => {
      if (!media.has(instance)) media.set(instance, muteProperty.get.call(instance));
    };
    Object.defineProperty(element, "muted", {
      ...muteProperty,
      set(value) {
        media.set(this, Boolean(value));
        muteProperty.set.call(this, muted || disposed || Boolean(value));
      },
    });
    element.play = function (...args) {
      remember(this);
      muteProperty.set.call(this, muted || disposed || media.get(this));
      return play.apply(this, args);
    };
  }

  return {
    setMuted(value) {
      if (disposed) return;
      muted = value !== false;
      for (const [context, gate] of gates) {
        gate.gain.value = muted ? 0 : 1;
        if (!muted && context.state === "suspended") context.resume()?.catch(() => {});
      }
      for (const [instance, ownMute] of media) muteProperty.set.call(instance, muted || ownMute);
    },
    dispose() {
      disposed = true;
      for (const gate of gates.values()) { gate.gain.value = 0; disconnect.call(gate); }
      for (const instance of media.keys()) muteProperty.set.call(instance, true);
      gates.clear(); media.clear();
    },
  };
}
