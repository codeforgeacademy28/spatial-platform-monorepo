export interface SpatialControllerInput {
  move: { x: number; y: number };
  look: { x: number; y: number };
  buttons: { jump: boolean; fire: boolean; crouch: boolean; sprint: boolean };
  ts: number;
}

export type ControllerConnectionState = 'disabled' | 'connecting' | 'connected' | 'disconnected' | 'error';

type InputListener = (input: SpatialControllerInput) => void;
type StateListener = (state: ControllerConnectionState) => void;

const DEFAULT_WS_PORT = '8080';
const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 5000;
const INPUT_TIMEOUT_MS = 250;

function defaultUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:${DEFAULT_WS_PORT}`;
}

function getControllerUrl(): string {
  const configured = import.meta.env.VITE_CONTROLLER_WS_URL?.trim();
  return configured || defaultUrl();
}

function clamp(value: unknown): number {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : 0;
  return Math.max(-1, Math.min(1, number));
}

function normalizeInput(message: unknown): SpatialControllerInput | null {
  if (!message || typeof message !== 'object') return null;
  const value = message as Record<string, unknown>;
  if (value.type !== 'input') return null;
  const move = value.move as Record<string, unknown> | undefined;
  const look = value.look as Record<string, unknown> | undefined;
  const buttons = value.buttons as Record<string, unknown> | undefined;
  return {
    move: { x: clamp(move?.x), y: clamp(move?.y) },
    look: { x: clamp(look?.x), y: clamp(look?.y) },
    buttons: {
      jump: Boolean(buttons?.jump),
      fire: Boolean(buttons?.fire),
      crouch: Boolean(buttons?.crouch),
      sprint: Boolean(buttons?.sprint),
    },
    ts: typeof value.ts === 'number' ? value.ts : Date.now(),
  };
}

export class ControllerLocomotionClient {
  private socket: WebSocket | null = null;
  private stopped = false;
  private reconnectDelay = RECONNECT_DELAY_MS;
  private reconnectTimer: number | null = null;
  private staleTimer: number | null = null;
  private inputListeners = new Set<InputListener>();
  private stateListeners = new Set<StateListener>();
  private lastInput: SpatialControllerInput = this.zeroInput();

  start(): void {
    if (this.socket || !this.stopped === false) {
      // Continue below only when the client has not been stopped.
    }
    this.stopped = false;
    this.connect();
  }

  stop(): void {
    this.stopped = true;
    if (this.reconnectTimer !== null) window.clearTimeout(this.reconnectTimer);
    if (this.staleTimer !== null) window.clearTimeout(this.staleTimer);
    this.reconnectTimer = null;
    this.staleTimer = null;
    this.emitZeroInput();
    this.socket?.close(1000, 'spatial view closed');
    this.socket = null;
    this.setState('disabled');
  }

  onInput(listener: InputListener): () => void {
    this.inputListeners.add(listener);
    return () => this.inputListeners.delete(listener);
  }

  onState(listener: StateListener): () => void {
    this.stateListeners.add(listener);
    return () => this.stateListeners.delete(listener);
  }

  getState(): ControllerConnectionState {
    return this.socket?.readyState === WebSocket.OPEN ? 'connected' : 'disconnected';
  }

  private connect(): void {
    if (this.stopped || this.socket) return;
    this.setState('connecting');
    try {
      const socket = new WebSocket(getControllerUrl());
      this.socket = socket;
      socket.addEventListener('open', () => {
        this.reconnectDelay = RECONNECT_DELAY_MS;
        socket.send(JSON.stringify({ type: 'hello', role: 'spatial' }));
        this.setState('connected');
        this.resetStaleTimer();
      });
      socket.addEventListener('message', (event) => this.handleMessage(event.data));
      socket.addEventListener('close', () => {
        if (this.socket === socket) this.socket = null;
        this.emitZeroInput();
        if (!this.stopped) {
          this.setState('disconnected');
          this.scheduleReconnect();
        }
      });
      socket.addEventListener('error', () => this.setState('error'));
    } catch {
      this.setState('error');
      this.scheduleReconnect();
    }
  }

  private handleMessage(raw: unknown): void {
    let message: unknown;
    try {
      message = typeof raw === 'string' ? JSON.parse(raw) : JSON.parse(String(raw));
    } catch {
      return;
    }
    const input = normalizeInput(message);
    if (!input) return;
    this.lastInput = input;
    this.resetStaleTimer();
    for (const listener of this.inputListeners) listener(input);
  }

  private resetStaleTimer(): void {
    if (this.staleTimer !== null) window.clearTimeout(this.staleTimer);
    this.staleTimer = window.setTimeout(() => this.emitZeroInput(), INPUT_TIMEOUT_MS);
  }

  private emitZeroInput(): void {
    const zero = this.zeroInput();
    this.lastInput = zero;
    for (const listener of this.inputListeners) listener(zero);
  }

  private zeroInput(): SpatialControllerInput {
    return { move: { x: 0, y: 0 }, look: { x: 0, y: 0 }, buttons: { jump: false, fire: false, crouch: false, sprint: false }, ts: Date.now() };
  }

  private scheduleReconnect(): void {
    if (this.stopped || this.reconnectTimer !== null) return;
    const delay = this.reconnectDelay;
    this.reconnectDelay = Math.min(this.reconnectDelay * 2, MAX_RECONNECT_DELAY_MS);
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }

  private setState(state: ControllerConnectionState): void {
    for (const listener of this.stateListeners) listener(state);
  }
}
