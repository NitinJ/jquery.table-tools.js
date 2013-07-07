(function($) {
  $.fn.tableTools = function(options) {

    return this.each(function(){

      //Give default values to options
      options = $.extend({
        itemsPerPage:10,
        deleteConfirmationHeading: "Delete?",
        deleteConfirmationBodyHtml:"Do you want to delete the selected rows?",
        deleteFunction: function(x){},
        responsive:1
      },options);

      //Check if its a table and return if its not
      if($(this).get(0).tagName != "TABLE") return;

      //Variables
      var elements = new Array();
      var headings = new Array();
      var parentElementOfTable = $(this).parent();
      var tableToolsToolbar = $("<div class='tabletoolstoolbar'></div>");
      var tableToolsContainer = $("<div id='tabletoolscontainer'>"+
        "<div id='deleteconfirmationmodal' class='tabletoolsmodal modal hide fade'>"+
          "<div class='modal-header'>"+
            "<button type='button' class='close' data-dismiss='modal' aria-hidden='true'>&times;</button>"+
            "<h3>"+options.deleteConfirmationHeading+"</h3>"+
          "</div>"+
          "<div class='modal-body'>"+
            "<p>"+options.deleteConfirmationBodyHtml+"</p>"+
          "</div>"+
          "<div class='modal-footer'>"+
            "<a href='#' data-dismiss='modal' class='btn'>No</a>"+
            "<a href='#' id='confirmdelete' data-dismiss='modal' class='btn btn-primary'>Yes</a>"+
          "</div>"+
        "</div>"+"</div>");
      var tableToolsBottombar = $("");
      var currentPage = 1;
      var totalPages = 1;
      var totalActiveRows = options.itemsPerPage;
      var totalSelectedRows = 0;
      var sortStateIcons = {"1":"icon-sort-down", "0":"icon-sort", "-1":"icon-sort-up"}
       
      //Detatch table from DOM
      var thisTable = $(this).detach();

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
          $("#deleteselectedbutton").show();
        else
         $("#deleteselectedbutton").hide(); 
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
        
      // Handling confirmation on delete modal
      tableToolsContainer.find("#confirmdelete").click(function(){
        var returnvalues = new Array();
        var deleted = 0;
        for(var i=0;i<elements.length;i++){
          if(elements[i].selected){
            elements.splice(i,1);
            deleted++;
            i--;
          }
          else{
            elements[i].obj.data('id', i);  
          }
        }
        changeTotalSelectedRows(0, deleted*-1);
        options.deleteFunction(returnvalues);
        $("#tabletoolscontainer").find(".tabletoolspagination").remove();
        $("#tabletoolscontainer").append(generatePagination());
        showPage(currentPage);
      });

      // Click to select and deselect
      for(i in elements){
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

      // Select all
      var selectAllButton = $("<button id='tabletools_selectallbutton' class='btn btn tabletoolstoolbar_button'><i class='icon-check'></i> <span class='visible-desktop visible-tablet'>Select all</span></button>").click(function(){
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
      var deSelectAllButton = $("<button class='btn btn tabletoolstoolbar_button'><i class='icon-check-empty'></i> <span class='visible-desktop visible-tablet'>Deselect all</span></button>").click(function(){
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
      var deleteSelectedButton = $("<button id='deleteselectedbutton' class='hide btn btn tabletoolstoolbar_button'><i class='icon-trash'></i> <span class='visible-desktop visible-tablet'>Delete selected</span></button>").click(function(){
        $("#deleteconfirmationmodal").modal('show');
      });

      // Search box
      var searchBox = $("<div class='input-prepend pull-right'><span class='add-on'><i class='icon-search'></i></span><input class='pull-right' type='text' placeholder='Search...'></div>").keyup(function(){
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
        var headings = new Array();
        blankTable.find("thead>tr>th").each(function(){
          headings.push($(this).text().trim());
        });
        for(i in elements){
          var tds = elements[i].obj.find("td");
            for(var j=0;j<tds.length;j++){
              $(tds[j]).prepend("<p class='tabletoolsresponsive_tdheading pull-left'>"+headings[j]+"</p>");
            }
        }
      }

      //Functions to generate pagination links
      var generatePagination = function(){
        var e = elements.length;
        var totalPages = parseInt(e/options.itemsPerPage)+1;
        var itemsperpage=options.itemsPerPage;
        var paginationhtml = '<div class="tabletoolspagination pagination"><p class="pull-right" id="numberofactiverows"></p><p style="margin-left:2px;margin-right:2px" class="pull-right" id="numberofselectedrows"></p> <ul><li><a href="#">Prev</a></li>';
        for(var i=1;i<=parseInt(e/itemsperpage)+1;i++)
          paginationhtml = paginationhtml + '<li><a href="#">'+i+'</a></li>';
        var paginationObj = $(paginationhtml + '<li><a href="#">Next</a></li></ul></div>');
        // CLick handler on page
        paginationObj.find("a").click(function(){
          var n = $(this).text();
          if(n=="Prev") n = (currentPage-1)<1?1:currentPage-1;
          if(n == "Next") n = (currentPage+1)>totalPages?totalPages:currentPage+1;
          else n = parseInt(n);
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
        //Show number of active rows
        $("#numberofactiverows").text("Showing " + count2 + " rows of " + elements.length);      
      }

      tableToolsToolbar.append(selectAllButton).append(deSelectAllButton).append(deleteSelectedButton).append(searchBox);
      tableToolsContainer.append(tableToolsToolbar).append(blankTable).append(generatePagination);
      parentElementOfTable.append(tableToolsContainer);

      showPage(1);
    });
  }
}(jQuery));