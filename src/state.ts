class State {
    private _state;
    private _statehandler;
    private _eventBus;

    constructor(data) {
        let self = this;
        this._eventBus = document.createElement('dummy-element');
        this._statehandler = {
            set(obj,prop,value) {
                obj[prop] = value;
                self._eventBus.dispatchEvent(new CustomEvent('state.' + prop, { detail: {
                    target: obj,
                    property: prop,
                    value: value
                }}));
                console.log(`${prop} changed: ${value}`);
                return true;
            }
         }
        this._state = new Proxy(data, this._statehandler);
      
    }

    commitState(prop: string, value: any | undefined) {
        this._state[prop] = value;
    }

    getState(prop: string) {
        return this._state[prop];
    }

    addEventListener(event: string, callback)
    {
        this._eventBus.addEventListener(event, callback);
    }

    removeEventListener(event: string, callback)
    {
        this._eventBus.addEventListener(event, callback);
    }

    dispatchEvent(event: string, detail = {})
    {
        this._eventBus.dispatchEvent(new CustomEvent(event, { detail }));
    }

}



export function initState():void {
    const data = {
        scene: 'start'
    };
    const state = new State(data);
    window.$game_state = state;
}