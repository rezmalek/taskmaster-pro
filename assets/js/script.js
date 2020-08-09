var tasks = {};

function createTask(taskText, taskDate, taskList) {
  // create elements that make up a task item
  var taskLi = $("<li>").addClass("list-group-item");
  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill")
    .text(taskDate);
  var taskP = $("<p>")
    .addClass("m-1")
    .text(taskText);

  // append span and p element to parent li
  taskLi.append(taskSpan, taskP);

  // check due date
  auditTask(taskLi);

  // append to ul list on the page
  $("#list-" + taskList).append(taskLi);
};

function loadTasks() {
  tasks = JSON.parse(localStorage.getItem("tasks"));

  // if nothing in localStorage, create a new object to track all task status arrays
  if (!tasks) {
    tasks = {
      toDo: [],
      inProgress: [],
      inReview: [],
      done: []
    };
  }

  // loop over object properties
  $.each(tasks, function(list, arr) {
    console.log(list, arr);
    // then loop over sub-array
    arr.forEach(function(task) {
      createTask(task.text, task.date, list);
    });
  });
};

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
};

// modal was triggered
$("#task-form-modal").on("show.bs.modal", function() {
  // clear values
  $("#modalTaskDescription, #modalDueDate").val("");
});

// modal is fully visible
$("#task-form-modal").on("shown.bs.modal", function() {
  // highlight textarea
  $("#modalTaskDescription").trigger("focus");
});

// save button in modal was clicked
$("#task-form-modal .btn-primary").click(function() {
  // get form values
  var taskText = $("#modalTaskDescription").val();
  var taskDate = $("#modalDueDate").val();

  if (taskText && taskDate) {
    createTask(taskText, taskDate, "toDo");

    // close modal
    $("#task-form-modal").modal("hide");

    // save in tasks array
    tasks.toDo.push({
      text: taskText,
      date: taskDate
    });

    saveTasks();
  }
});

$(".list-group").on("click", "p", function() {
  var text = $(this)
    .text()
    .trim();
  
  // create textarea element
  var textInput = $("<textarea>")
    .addClass("form-control")
    .val(text);

  $(this).replaceWith(textInput);

  // automatically highlight the input box (focus)
  textInput.trigger("focus");
});

// revert back textarea when it's out of focus (to save it)
$(".list-group").on("blur", "textarea", function() {
  // get the current value of textarea
  var text = $(this)
    .val()
    .trim();

  // get the parent ul's id attribute (status)
  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");
  
  // get the task's position in the list of other li elements 
  var index = $(this)
    .closest(".list-group-item") 
    .index();

  // update the tasks object
  tasks[status][index].text = text;
  saveTasks();

  // recreate p element 
  var taskP = $("<p>")
    .addClass("m-1") 
    .text(text);

  // replace textarea with p element 
  $(this).replaceWith(taskP);
});

$(".list-group").on("click", "span", function() {
  var date = $(this)
    .text()
    .trim();

  var dateInput = $("<input>")
    .attr("type", "text")
    .addClass("form-control")
    .val(date);

  $(this).replaceWith(dateInput);

  dateInput.datepicker({
    minDate: 1,
    onClose: function() {
      // onClose closes the datepicker when a user clicks anywhere on the page outside the date picker 
      $(this).trigger("change");
    }
  });

  dateInput.trigger("focus");
});

$(".list-group").on("change", "input[type='text']", function() {
  var date = $(this)
    .val()
    .trim();

  var status = $(this)
    .closest(".list-group")
    .attr("id")
    .replace("list-", "");

  var index = $(this)
    .closest(".list-group-item")
    .index();

  tasks[status][index].date = date;
  saveTasks();

  var taskSpan = $("<span>")
    .addClass("badge badge-primary badge-pill") 
    .text(date);

  $(this).replaceWith(taskSpan)

  // Pass task's <li> element into auditTask() to check new due date
  auditTask($(taskSpan).closest(".list-group-item"))
})

// remove all tasks
$("#remove-tasks").on("click", function() {
  for (var key in tasks) {
    tasks[key].length = 0;
    $("#list-" + key).empty();
  }
  saveTasks();
});

// load tasks for the first time
loadTasks();

// drag and drop
$(".card .list-group").sortable({
  connectWith: $(".card .list-group"),
  scroll: false,
  tolerance: "pointer",
  helper: "clone",
  activate: function(event) { 
   $(this).addClass("dropover");
   $(".bottom-trash").addClass("bottom-trash-drag");
  },
  deactivate: function(event) {
    $(this).removeClass("dropover");
    $(".bottom-trash").removeClass("bottom-trash-drag");
  },
  over: function(event) { 
    $(this).addClass("dropover-active");
    $(".bottom-trash").addClass("bottom-trash-active")
  },
  out: function(event) {
     $(this).removeClass("dropover-active");
     $(".bottom-trash").removeClass("bottom-trash-active")
  },
  update: function(event) { 
    var tempArr = [];
    // loop over current set of children in sortable list 
    $(this).children().each(function() {
      var text = $(this) 
        .find("p") 
        .text()
        .trim();
      
      var date = $(this) 
      .find("span") 
      .text()
      .trim(); 

      // add task data to the temp array as an object 
      tempArr.push({
        text: text,
        date: date 
      });
    });
    // trim down list's ID to match object property 
    var arrName = $(this)
      .attr("id") 
      .replace("list-", "");
    // update array on tasks object and save 
    tasks[arrName] = tempArr;
    saveTasks();
  }
});

$("#trash").droppable({
  accept: ".card .list-group-item",
  tolerance: "touch",
  drop: function(event, ui) {
    ui.draggable.remove();
  },
  over: function(event, ui) {
    
  },
  out: function(event, ui) {
    
  }
});

$("#modalDueDate").datepicker({
  minDate: 1
});

function auditTask(taskEl) {
  var date = $(taskEl)
    .find("span")
    .text()
    .trim();

  // convert to moment object at 6:00pm
  var time = moment(date, "L").set("hour", 18);

  // remove any old classes from element 
  $(taskEl).removeClass("list-group-item-warning list-group-item-danger");

  // apply new class if task is near/over due date 
  if (moment().isAfter(time)) {
    $(taskEl).addClass("list-group-item-danger"); 
  } else if (Math.abs(moment().diff(time, "days")) <= 2) { 
    $(taskEl).addClass("list-group-item-warning");
  }
};


