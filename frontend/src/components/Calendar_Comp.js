import React from "react";
import {
  Calendar as BigCalendar,
  CalendarProps,
  momentLocalizer,
} from "react-big-calendar";
import moment from "moment";

const localizer = momentLocalizer(moment);

const CustomToolbar = (toolbar) => {
  const goToBack = () => {
    toolbar.onNavigate("PREV");
  };

  const goToNext = () => {
    toolbar.onNavigate("NEXT");
  };

  const goToToday = () => {
    toolbar.onView("today");
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

export default function Calendar(props) {
  return (
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
      }}
    />
  );
}
