(function () {
  function validEmail(email) {
    var re = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/i;
    return re.test(email);
  }

  function validateHuman(honeypot) {
    if (honeypot) {  //if hidden form filled up
      console.log("Robot Detected!");
      return true;
    } else {
      console.log("Welcome Human!");
    }
  }

  // get all data in form and return object
  function getFormData(form) {
    var elements = form.elements;

    var fields = Object.keys(elements).filter(function (k) {
      return (elements[k].name !== "honeypot");
    }).map(function (k) {
      if (elements[k].name !== undefined) {
        return elements[k].name;
        // special case for Edge's html collection
      } else if (elements[k].length > 0) {
        return elements[k].item(0).name;
      }
    }).filter(function (item, pos, self) {
      return self.indexOf(item) == pos && item;
    });

    var formData = {};
    fields.forEach(function (name) {
      var element = elements[name];

      // singular form elements just have one value
      formData[name] = element.value;

      // when our element has multiple items, get their values
      if (element.length) {
        var data = [];
        for (var i = 0; i < element.length; i++) {
          var item = element.item(i);
          if (item.checked || item.selected) {
            data.push(item.value);
          }
        }
        formData[name] = data.join(', ');
      }
    });
    // var body = "";
    // for (const property in formData) {
    //   if (property != "g-recaptcha-response") {
    //     body += property + " : " + formData[property] + " ";
    //   }

    // }

    // add form-specific values into the data
    formData.formDataNameOrder = JSON.stringify(fields);
    formData.formGoogleSheetName = form.dataset.sheet || "responses"; // default sheet name
    formData.formGoogleSendEmail = form.dataset.email || ""; // no email by default
    // formData.body = body;
    //console.log(formData);
    return formData;
  }

  function handleFormSubmit(event) {  // handles form submit without any jquery
    event.preventDefault();           // we are submitting via xhr below
    var form = event.target;
    var data = getFormData(form);         // get the values submitted in the form

    /* OPTION: Remove this comment to enable SPAM prevention, see README.md
    if (validateHuman(data.honeypot)) {  //if form is filled, form will not be submitted
      return false;
    }
    */

    if (data.name == undefined || data.message == undefined || data.email == undefined) {
      $('.fields-invalid').css("display", "block")
      return false;
    } else {

      if (!data.name && data.name == "") {
        $('.name-invalid').css("display", "block")
        return false;
      }

      if (!data.message && data.message == "") {
        $('.message-invalid').css("display", "block")
        return false;
      }

      if (data.email == "" && !data.email && !validEmail(data.email)) {   // if email is not valid show error
        $('.email-invalid').css("display", "block")
        return false;
      }
      const v = grecaptcha.getResponse();
      if (v.length == 0) {

        $('.captcha-invalid').css("display", "block")
        return false;
      }

      disableAllButtons(form);
      var url = form.action;
      var xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      // xhr.withCredentials = true;
      xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
      xhr.onreadystatechange = function () {
        response = JSON.parse(xhr.responseText);
        //console.log(xhr.status, xhr.statusText);
        //console.log(response.result);
        if (response.result == "error") {
          console.log('a', $('.' + response.field + '-invalid'))
          $('.' + response.field + '-invalid').css("display", "block")
        } else {
          var thankYouMessage = $('.thankyou_message');
          //console.log(thankYouMessage);
          if (thankYouMessage) {
            thankYouMessage.css("display", "block")
          }
          $(".php-email-form").trigger('reset');
          $('.invalid-feedback').css("display", "none")
        }
        // var formElements = form.querySelector(".form-elements")
        // if (formElements) {
        //   formElements.style.display = "none"; // hide form
        // }

        $('.sub-button').prop('disabled', false);

        grecaptcha.reset()
        window.setInterval(function () {
          thankYouMessage.css("display", "none")
        }, 30000);
        return;
      };
      // url encode form data for sending as post data
      var encoded = Object.keys(data).map(function (k) {
        return encodeURIComponent(k) + "=" + encodeURIComponent(data[k]);
      }).join('&');
      //console.log(encoded);
      xhr.send(encoded);
    }


  }

  function loaded() {
    //console.log("Contact form submission handler loaded successfully.");
    // bind to the submit event of our form
    var forms = document.querySelectorAll("form.php-email-form");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", handleFormSubmit, false);
    }
  };
  document.addEventListener("DOMContentLoaded", loaded, false);

  function disableAllButtons(form) {
    var buttons = form.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].disabled = true;
    }
  }
})();
