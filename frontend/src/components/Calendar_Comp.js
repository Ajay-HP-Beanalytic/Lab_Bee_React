import {
  Calendar as BigCalendar,
  CalendarProps,
  momentLocalizer,
} from "react-big-calendar";
import moment from "moment";

const localizer = momentLocalizer(moment);

export default function Calendar(props) {
  return <BigCalendar {...props} localizer={localizer}
    draggableAccessor={'isDraggable'}
    resizable

    onDragStart={(props) => {
      console.log('onDragStart', props)
    }}

    onEventDrop={(props) => {
      console.log('onEventDrop', props)
    }}

    onEventResize={(props) => {
      console.log('onEventResize', props)
    }}

    style={{ height: "100vh" }}
  />;
}
