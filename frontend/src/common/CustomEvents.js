
function subscribe(eventName, listener) {
  document.addEventListener(eventName, listener)
}

function unsubscribe(eventName, listener) {
  document.removeEventListener(eventName, listener)
}

function publish(eventName, data) {
  const event = new CustomEvent(eventName, { detail: data })
  document.dispatchEvent(event)
}

const EVENT_CONSTANTS = {
  openLoader: "openLoader"
}
export { publish, subscribe, unsubscribe, EVENT_CONSTANTS }