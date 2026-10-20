export interface SpatialControllerInput {
  move: { x: number; y: number };
  look: { x: number; y: number };
  buttons: { jump: boolean; fire: boolean; crouch: boolean; sprint: boolean };
  ts: number;
}

export type ControllerConnectionState =
  'disabled' | 'connecting' | 'connected' | 'disconnected' | 'error';

type InputListener = (input: SpatialControllerInput) => void;
type StateListener = (state: ControllerConnectionState) => void;

const INPUT_TIMEOUT_MS = 250;
const CONTROLLER_STATE_TIMEOUT_MS = 5_000;
const DEFAULT_CONTROLLER_WS_URL = 'wss://controller-game-13dk.onrender.com';

function getUrl(): string {
  const configured = import.meta.env.VITE_CONTROLLER_WS_URL?.trim();
  if (configured) return configured;
  if (
    window.location.protocol === 'http:' &&
    /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)
  ) {
    return 'ws://localhost:8080';
  }
  return DEFAULT_CONTROLLER_WS_URL;
}

function clamp(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(-1, Math.min(1, value)) : 0;
}

function normalize(message: unknown): SpatialControllerInput | null {
  if (!message || typeof message !== 'object') return null;
  const candidate = message as Record<string, unknown>;
  if (candidate.type !== 'input') return null;
  const move = candidate.move as Record<string, unknown> | undefined;
  const look = candidate.look as Record<string, unknown> | undefined;
  const buttons = candidate.buttons as Record<string, unknown> | undefined;
  return {
    move: { x: clamp(move?.x), y: clamp(move?.y) },
    look: { x: clamp(look?.x), y: clamp(look?.y) },
    buttons: {
      jump: Boolean(buttons?.jump),
      fire: Boolean(buttons?.fire),
      crouch: Boolean(buttons?.crouch),
      sprint: Boolean(buttons?.sprint),
    },
    ts: typeof candidate.ts === 'number' ? candidate.ts : Date.now(),
  };
}

export class ControllerLocomotionClient {
  private socket: WebSocket | null = null;
  private stopped = true;
  private reconnectTimer: number | null = null;
  private staleTimer: number | null = null;
  private controllerStateTimer: number | null = null;
  private delay = 1_000;
  private readonly inputs = new Set<InputListener>();
  private readonly states = new Set<StateListener>();

  start(): void {
    if (!this.stopped && (this.socket || this.reconnectTimer !== null)) return;
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    this.clearTimers();
    this.emitZero();
    const socket = this.socket;
    this.socket = null;
    socket?.close(1000, 'spatial view closed');
    this.setState('disabled');
  }

  onInput(listener: InputListener): () => void {
    this.inputs.add(listener);
    return () => this.inputs.delete(listener);
  }
  onState(listener: StateListener): () => void {
    this.states.add(listener);
    return () => this.states.delete(listener);
  }

  private connect(): void {
    if (this.stopped || this.socket) return;
    this.setState('connecting');
    try {
      const socket = new WebSocket(getUrl());
      this.socket = socket;
      socket.onopen = () => {
        if (this.socket !== socket) return;
        this.delay = 1_000;
        socket.send(JSON.stringify({ type: 'hello', role: 'spatial' }));
        this.waitForControllerState();
      };
      socket.onmessage = ({ data }) => this.handleMessage(data);
      socket.onclose = () => {
        if (this.socket === socket) this.socket = null;
        if (this.controllerStateTimer !== null) window.clearTimeout(this.controllerStateTimer);
        this.controllerStateTimer = null;
        this.emitZero();
        if (!this.stopped) {
          this.setState('disconnected');
          this.scheduleReconnect();
        }
      };
      socket.onerror = () => this.setState('error');
    } catch {
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  private handleMessage(data: unknown): void {
    let message: unknown;
    try {
      message = JSON.parse(String(data));
    } catch {
      return;
    }
    if (message && typeof message === 'object') {
      const candidate = message as Record<string, unknown>;
      if (candidate.type === 'controller-state') {
        if (this.controllerStateTimer !== null) window.clearTimeout(this.controllerStateTimer);
        this.controllerStateTimer = null;
        if (candidate.connected === true) {
          this.setState('connected');
          this.resetStale();
        } else {
          this.emitZero();
          this.setState('disconnected');
        }
        return;
      }
    }
    const input = normalize(message);
    if (!input) return;
    this.resetStale();
    this.inputs.forEach((listener) => listener(input));
  }

  private waitForControllerState(): void {
    if (this.controllerStateTimer !== null) window.clearTimeout(this.controllerStateTimer);
    this.controllerStateTimer = window.setTimeout(() => {
      this.controllerStateTimer = null;
      if (!this.stopped && this.socket) {
        this.emitZero();
        this.setState('disconnected');
      }
    }, CONTROLLER_STATE_TIMEOUT_MS);
  }

  private resetStale(): void {
    if (this.staleTimer !== null) window.clearTimeout(this.staleTimer);
    this.staleTimer = window.setTimeout(() => this.emitZero(), INPUT_TIMEOUT_MS);
  }

  private emitZero(): void {
    const input: SpatialControllerInput = {
      move: { x: 0, y: 0 },
      look: { x: 0, y: 0 },
      buttons: { jump: false, fire: false, crouch: false, sprint: false },
      ts: Date.now(),
    };
    this.inputs.forEach((listener) => listener(input));
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer !== null) return;
    const delay = this.delay;
    this.delay = Math.min(this.delay * 2, 5_000);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private clearTimers(): void {
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    if (this.staleTimer !== null) window.clearTimeout(this.staleTimer);
    if (this.controllerStateTimer !== null) window.clearTimeout(this.controllerStateTimer);
    this.reconnectTimer = this.staleTimer = this.controllerStateTimer = null;
  }

  private setState(state: ControllerConnectionState): void {
    this.states.forEach((listener) => listener(state));
  }
}
