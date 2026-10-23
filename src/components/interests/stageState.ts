// Small pieces of RoomStage's behaviour, kept free of React and three.js

type Activatable = { setActive: (active: boolean) => void };

// Remembers whether the stage is on screen, so a scene that finishes loading late starts in the right state
export function visibilityGate() {
    let visible = false;
    let scene: Activatable | null = null;
    return {
        setVisible: (value: boolean) => {
            visible = value;
            scene?.setActive(value);
        },
        attach: (s: Activatable) => {
            scene = s;
            s.setActive(visible);
        },
        detach: () => {
            scene = null;
        },
    };
}

// Keyboard focus shows the label; focus from a click (or returned after closing a panel) doesn't
export const focusShowsLabel = (el: { matches: (selector: string) => boolean }) => el.matches(':focus-visible');
