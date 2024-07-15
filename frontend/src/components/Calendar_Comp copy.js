import React, { useState } from "react";
import {
  Calendar as BigCalendar,
  CalendarProps,
  momentLocalizer,
} from "react-big-calendar";
import moment from "moment";

const localizer = momentLocalizer(moment);

//Code to modify the custom toolbar:
const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate("PREV");
  };

  const goToNext = () => {
    toolbar.onNavigate("NEXT");
  };

  const goToToday = () => {
    toolbar.onNavigate("TODAY");
  };

  return (
    <div className="rbc-toolbar">
      <span className="rbc-btn-group">
        <button type="button" onClick={goToToday}>
          Today
        </button>
        <button type="button" onClick={goToBack}>
          Previous
        </button>
        <button type="button" onClick={goToNext}>
          Next
        </button>
      </span>
      <span className="rbc-toolbar-label">{toolbar.label}</span>
      <span className="rbc-btn-group">
        {toolbar.views.map((view) => (
          <button
            key={view}
            type="button"
            className={toolbar.view === view ? "rbc-active" : ""}
            onClick={() => toolbar.onView(view)}
          >
            {view}
          </button>
        ))}
      </span>
    </div>
  );
};

//Modify the eventGutter:
const CustomGutterHeader = ({ label }) => {
  return (
    <div className="rbc-label rbc-time-header-gutter custom-header">
      <span>{label}</span>
      <span>Full Day Events</span>
    </div>
  );
};

export default function Calendar(props) {
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const eventPropGetter = (event, start, end, isSelected) => {
    const className = isSelected ? "rbc-selected" : "";
    return { className };
  };

  const onShowMore = (events, date) => {
    setSelectedEvents(events);
    setShowModal(true);
  };

  const handleEventClick = (event) => {
    // Redirect to the day view or handle the event click here
    console.log("Event clicked:", event);
  };

  return (
    <>
      <BigCalendar
        {...props}
        localizer={localizer}
        draggableAccessor={"isDraggable"}
        resizable
        onDragStart={(props) => {
          console.log("onDragStart", props);
        }}
        onEventDrop={(props) => {
          console.log("onEventDrop", props);
        }}
        onEventResize={(props) => {
          console.log("onEventResize", props);
        }}
        style={{ height: "100vh" }}
        components={{
          toolbar: CustomToolbar,
          timeGutterHeader: CustomGutterHeader,
        }}
        eventPropGetter={eventPropGetter}
        onShowMore={onShowMore}
      />

      {showModal && (
        <div className="custom-modal">
          <div className="modal-content">
            <h4>Events</h4>
            <ul>
              {selectedEvents.map((event, index) => (
                <li key={index} onClick={() => handleEventClick(event)}>
                  {event.title}
                </li>
              ))}
            </ul>
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
