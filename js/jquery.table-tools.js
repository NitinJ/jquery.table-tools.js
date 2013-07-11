(function($) {
  $.fn.tableTools = function(options) {

    return this.each(function(){

      //Give default values to options
      options = $.extend({}, {
        itemsPerPage:10,
        responsive:1,
        addRowButton: 1,
        searchBox: 1,
        deleteButton: 1,
        selectDeselectButtons:1,
        rowSelect:1,
        pagination: 1,
        useSmallerIcons: 0,
        deleteConfirmationHeading: "Delete?",
        deleteConfirmationBodyHtml:"Do you want to delete the selected rows?",
        addRowButtonText: "Add row",
        deleteFunction: function(x){},
        addRowValidationFunction: function(x){return true;},
        addRowCallback: function(x){return true},
        pageChangeCallback: function(x){return true;}
      },options);

      // Option validation
      options.itemsPerPage = options.itemsPerPage<0?10:options.itemsPerPage;
      if(!options.pagination){options.itemsPerPage=Number.MAX_VALUE;}

      //Check if its a table and return if its not
      if($(this).get(0).tagName != "TABLE") return;

      //Variables
      var responsiveWidth = [480];
      var elements = new Array();
      var headings = new Array();
      var parentElementOfTable = $(this).parent();
      var previousElementOfTable = $(this).prev();
      var tableToolsToolbar = $("<div class='tabletoolstoolbar'></div>");
      var tableToolsContainer = $("<div class='tabletoolscontainer'><div class='deleteconfirmationmodal tabletoolsmodal modal hide fade'><div class='modal-header'><button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button><h3>"+options.deleteConfirmationHeading+"</h3></div><div class='modal-body'><p>"+options.deleteConfirmationBodyHtml+"</p></div><div class='modal-footer'><a href='#' data-dismiss='modal' class='btn'>No</a><a href='#' data-dismiss='modal' class='tabletools_confirmdelete btn btn-primary'>Yes</a></div></div></div>");
      var addRowModal = $("<div class='tabletools_addrowmodal tabletoolsmodal modal hide fade'><div class='modal-header'><button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button><h3>Add new row</h3></div><div class='tabletools_addrowmodalbody modal-body'></div><div class='modal-footer'><a href='#' data-dismiss='modal' class='btn'>Close</a><a href='#' class='btn btn-primary tabletools_addrowbuttonconfirm' data-dismiss='modal'>Add row</a></div></div>");
      tableToolsContainer.append(addRowModal);
      var tableToolsBottombar = $("");
      var currentPage = 1;
      var totalPages = 1;
      var totalActiveRows = options.itemsPerPage;
      var totalSelectedRows = 0;
      var sortStateIcons = {"1":"icon-sort-down", "0":"icon-sort", "-1":"icon-sort-up"}
       
      //Detatch table from DOM
      var thisTable = $(this).detach();

      //Width management

      // Get all headings
      var headings = new Array();
      thisTable.find("thead>tr>th").each(function(){
        headings.push($(this).text().trim());
      });

      //Store all the elements
      var e = 0;
      thisTable.find("tbody > tr").each(function(){
        $(this).data('id', e++);
        elements.push({obj:$(this), selected:0, active:1});
      });

      //FUNCTIONS
      var changeTotalSelectedRows = function(s, n){
        if(!s) totalSelectedRows = totalSelectedRows + n;
        else totalSelectedRows = n;
        if(totalSelectedRows)
          tableToolsToolbar.find(".deleteselectedbutton").show();
        else
         tableToolsToolbar.find(".deleteselectedbutton").hide(); 
      }

      //sort
      var sortTable = function(c, x){
        elements.sort(function(a, b){
          var val1 = a.obj.children("td:nth-child("+(c+1)+")").text();
          var val2 = b.obj.children("td:nth-child("+(c+1)+")").text();
          val1 = val1<=val2;
          if(x==1){
            if(val1)
              return -1;
            else
              return 1;
          }
          else{
            if(val1)
              return 1;
            else
              return -1;
          }
        });
        for(i in elements){
          elements[i].obj.data('id', i);
        }
        showPage(currentPage);
      }
      
      //Functions to generate pagination links
      var generatePagination = function(){
        var e = 0;
        for(i in elements){
          if(elements[i].active)
            e++;
        }
        var totalPages = Math.ceil(e/options.itemsPerPage);
        var itemsperpage=options.itemsPerPage;
        var paginationhtml = '<div class="tabletoolspagination pagination"><p class="pull-right tabletools_numberofactiverows_p"></p><p style="margin-left:2px;margin-right:2px" class="pull-right numberofselectedrows"></p> <ul><li><a href="#">Prev</a></li>';
        for(var i=1;i<=totalPages;i++)
          paginationhtml = paginationhtml + '<li><a href="#">'+i+'</a></li>';
        var paginationObj = $(paginationhtml + '<li><a href="#">Next</a></li></ul></div>');
        // CLick handler on page
        paginationObj.find("a").click(function(){
          var n = $(this).text();
          if(n=="Prev") {
            if(currentPage-1 < 1){
              n=1;
            }
            else{
              n = currentPage - 1;
              options.pageChangeCallback();
            }
          }
          if(n == "Next") {
            if(currentPage+1 > totalPages){
              n = totalPages;
            }
            else{
              n = currentPage + 1;
              options.pageChangeCallback();
            }
          }
          else if(n == currentPage){
            n = parseInt(n);
          }
          else {
            n = parseInt(n);
            options.pageChangeCallback();
          }
          currentPage = n;
          showPage(currentPage);
        });
        return paginationObj;
      }

      // Main() Function to show a page(called when pagination link is clicked)
      var showPage = function(p) {
        blankTable.find("tbody").children().detach();
        var content = $('');
        p = p>e?e:p;
        var count=0,count2=0;

        for(i in elements){
          if(count>=options.itemsPerPage*(p-1) && count2<options.itemsPerPage){
            if(elements[i].active){
              count2++;
              blankTable.find("tbody").append(elements[i].obj);
            }
          }
          else if(elements[i].active) 
            count++;
        }
        if(options.pagination && elements.length>options.itemsPerPage){
          //Show pagination
          tableToolsContainer.find(".tabletoolspagination").remove();
          tableToolsContainer.append(generatePagination());
          //Show number of active rows
          tableToolsContainer.find(".tabletools_numberofactiverows_p").text("Showing " + count2 + " rows of " + elements.length);
          tableToolsContainer.find(".tabletoolspagination>ul>li>a").removeClass("tabletoolspagination_acurrentpage");
          tableToolsContainer.find(".tabletoolspagination>ul>li:nth-child("+(currentPage+1)+")>a").addClass("tabletoolspagination_acurrentpage");
        }
      }

      if(!options.rowSelect){}
      else{
        // Click to select and deselect events
        for(i in elements){
          elements[i].obj.css({'cursor':'pointer'});
          elements[i].obj.click(function(e){
            var id = $(this).data('id');
            if(elements[id].selected){
              elements[id].selected=0;
              elements[id].obj.removeClass("tabletoolsselectedtr");
              elements[id].obj.find("td:first-child()>.tabletoolsselectedrowicon").remove();
              changeTotalSelectedRows(0,-1);
            }
            else{
              elements[id].selected=1;
              elements[id].obj.addClass("tabletoolsselectedtr");
              elements[id].obj.find("td:first-child()").prepend($("<i class='tabletoolsselectedrowicon icon-ok'></i>"));
              changeTotalSelectedRows(0,1);
            }
          });
        }  
      }
      
      // Adding add row modal
      for(i in headings){
        var html = $('<form class="form-horizontal"><div class="control-group"><label for="tabletools_input'+i+'" class="control-label">'+headings[i]+'</label><div class="controls"><input id="tabletools_input'+i+'" type="text"></div></div></form>');
        tableToolsContainer.find(".tabletools_addrowmodalbody").append(html);
      }

      // Handling confirmation on delete modal
      tableToolsContainer.find(".tabletools_confirmdelete").click(function(){
        var returnvalues = new Array();
        var deleted = 0;
        for(var i=0;i<elements.length;i++){
          if(elements[i].selected){
            var columns = elements[i].obj.find("td");
            var columnvalues = new Array();
            console.log(columns);
            for(var j=0;j<columns.length;j++){
              columnvalues.push( $(columns[j]).contents().filter(function(){return this.nodeType === 3;}).text() )
            }
            elements.splice(i,1);
            deleted++;
            i--;
            returnvalues.push(columnvalues);
          }
          else{
            elements[i].obj.data('id', i);  
          }
        }
        changeTotalSelectedRows(0, deleted*-1);
        options.deleteFunction(returnvalues);
        if(options.pagination && elements.length>options.itemsPerPage){
          tableToolsContainer.find(".tabletoolspagination").remove();
          tableToolsContainer.append(generatePagination());
        }
        showPage(currentPage);
      });

      // Handling confirmation on add row
      tableToolsContainer.find(".tabletools_addrowbuttonconfirm").click(function(){
        var inputs = tableToolsContainer.find(".tabletools_addrowmodalbody input");
        var inputarr = new Array();
        for(var i=0;i<inputs.length;i++){
          inputarr.push($(inputs[i]).val());
        }
        if(options.addRowValidationFunction(inputarr)){
          var rowcopy = $("<tr></tr>");
          for(i in headings){
            if(options.responsive){
              rowcopy.append("<td><p class='tabletoolsresponsive_tdheading pull-left'>"+headings[i]+"</p>"+inputarr[i]+"</td>");
            }
            else{
              rowcopy.append("<td>"+inputarr[i]+"</td>");
            }
          }
          rowcopy.data('id', elements.length);
          rowcopy.click(function(e){
            var id = $(this).data('id');
            if(elements[id].selected){
              elements[id].selected=0;
              elements[id].obj.removeClass("tabletoolsselectedtr");
              elements[id].obj.find("td:first-child()>.tabletoolsselectedrowicon").remove();
              changeTotalSelectedRows(0,-1);
            }
            else{
              elements[id].selected=1;
              elements[id].obj.addClass("tabletoolsselectedtr");
              elements[id].obj.find("td:first-child()").prepend($("<i class='tabletoolsselectedrowicon icon-ok'></i>"));
              changeTotalSelectedRows(0,1);
            }
          });
          elements.push({obj:rowcopy, active:1, selected:0});
          if(options.pagination && elements.length>options.itemsPerPage){
            tableToolsContainer.find(".tabletoolspagination").remove();
            tableToolsContainer.append(generatePagination());
          }

          var forms = tableToolsContainer.find("form");
          console.log(forms);
          for(i in forms){
            try{forms[i].reset();}
            catch(err){}
          }
          options.addRowCallback(inputarr);
          showPage(currentPage);
        }
      });

      // Add row
      var addRowButton = $("<button id='tabletools_addrowbutton' class='btn btn tabletoolstoolbar_button'><i class='icon-plus'></i> <span class='tabletools_smallericons"+options.useSmallerIcons+" visible-desktop visible-tablet'>"+options.addRowButtonText+"</span></button>").click(function(){
        tableToolsContainer.find(".tabletools_addrowmodal").modal('show');
      });

      // Select all
      var selectAllButton = $("<button id='tabletools_selectallbutton' class='btn btn tabletoolstoolbar_button'><i class='icon-check'></i> <span class='tabletools_smallericons"+options.useSmallerIcons+" visible-desktop visible-tablet'>Select all</span></button>").click(function(){
        var selected=elements.length;
        for(i in elements){
          if(!elements[i].selected && elements[i].active){
            elements[i].selected=1;
            elements[i].obj.addClass("tabletoolsselectedtr");
            elements[i].obj.find("td:first-child()").prepend($("<i class='tabletoolsselectedrowicon icon-ok'></i>"));
          }  
        }
        changeTotalSelectedRows(1, selected);
        showPage(currentPage);
      });

      // Deselect all
      var deSelectAllButton = $("<button class='btn btn tabletoolstoolbar_button'><i class='icon-check-empty'></i> <span class='tabletools_smallericons"+options.useSmallerIcons+" visible-desktop visible-tablet'>Deselect all</span></button>").click(function(){
        var deselected=0;
        for(i in elements){
          if(elements[i].selected && elements[i].active){
            deselected++;
            elements[i].selected=0;
            elements[i].obj.removeClass("tabletoolsselectedtr");
            elements[i].obj.find("td:first-child()>.tabletoolsselectedrowicon").remove();
          }  
        }
        changeTotalSelectedRows(0, deselected*-1);
        showPage(currentPage);
      });

      // DeleteSelectedRows button
      var deleteSelectedButton = $("<button class='deleteselectedbutton hide btn btn tabletoolstoolbar_button'><i class='icon-trash'></i> <span class='tabletools_smallericons"+options.useSmallerIcons+" visible-desktop visible-tablet'>Delete selected</span></button>").click(function(){
        tableToolsContainer.find(".deleteconfirmationmodal").modal('show');
      });

      // Search box
      if(!options.useSmallerIcons)
        var searchBox = $("<div class='tabletools_searchbox input-prepend pull-right' style='margin-right:1px'><span class='add-on'><i class='icon-search'></i></span><input class='pull-right' type='text' placeholder='Search...'></div>");
      else
        var searchBox = $("<div class='tabletools_searchbox input-prepend pull-right' style='margin-right:1px'><span class='add-on'><i class='icon-search'></i></span><input class='input input-small pull-right' type='text' placeholder='Search...'></div>");
      searchBox.keyup(function(){
        var str = $(this).find("input").val();
        for(i in elements){
            if(elements[i].obj.text().indexOf(str) < 0){
              elements[i].active=0;
            }
            else{
              elements[i].active=1;
            }
        }
        showPage(currentPage);
      });

      //Get total number of pages needed. Empty the table first
      totalPages = parseInt(e/options.itemsPerPage)+1;
      var blankTable = thisTable.clone();
      blankTable.find("tbody").children().remove();

      //Sort icons
      blankTable.find("thead>tr>th").each(function(){
        $(this).data('sort','0');
        $(this).addClass("tabletoolsheadings");
        var sortButton = $("<i class='tabletoolssorticon pull-right icon-sort'></i>");
        $(this).append(sortButton);
        var col = $(this).parent().children().index($(this));
        
        $(this).click(function(e){
          sortState = parseInt($(this).data('sort'));
          $(this).find(".tabletoolssorticon").removeClass(sortStateIcons[sortState]);
          if(!sortState)
            sortState = 1;
          else
            sortState = sortState*-1;
          $(this).find(".tabletoolssorticon").addClass(sortStateIcons[sortState]);
          $(this).data('sort',sortState);
          sortTable(col, sortState);
        });
      });

      // Responsive class
      if(options.responsive){
        blankTable.addClass("tabletoolsresponsive_table");
        searchBox.addClass("tabletoolsresponsive_searchbox");
        for(i in elements){
          var tds = elements[i].obj.find("td");
            for(var j=0;j<tds.length;j++){
              $(tds[j]).prepend("<p class='tabletoolsresponsive_tdheading pull-left'>"+headings[j]+"</p>");
            }
        }
      }

      if(options.addRowButton) tableToolsToolbar.append(addRowButton);
      if(options.selectDeselectButtons) tableToolsToolbar.append(selectAllButton).append(deSelectAllButton);
      if(options.deleteButton) tableToolsToolbar.append(deleteSelectedButton);
      if(options.searchBox) tableToolsToolbar.append(searchBox);
      
      tableToolsContainer.append(tableToolsToolbar).append(blankTable);

      if(options.pagination && elements.length>options.itemsPerPage) tableToolsContainer.append(generatePagination);

      if(previousElementOfTable.length) previousElementOfTable.after(tableToolsContainer);
      else parentElementOfTable.append(tableToolsContainer);

      showPage(1);
    });
  }
}(jQuery));
