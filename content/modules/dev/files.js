/*
 * files.js: 
 * This module defines the namespace NB.files
 * It requires the following modules:
 *		Module
 *		NB
 *		jquery
 *
 *
 Author 
 Sacha Zyto (sacha@csail.mit.edu) 

 License
 Copyright (c) 2010 Massachusetts Institute of Technology.
 MIT License (cf. MIT-LICENSE.txt or http://www.opensource.org/licenses/mit-license.php)
*/

try{    
    Module.require("NB", 0.1);
    Module.createNamespace("NB.files", 0.1);
}
catch (e){
    alert("[inbox] Init Error: "+e);
}

NB.files.currentEnsemble = 0;
NB.files.currentFolder=0;
NB.files.model = null;
NB.files.set_model = function(model){
    NB.files.model = model;
    var $util_window = $.concierge.get_component("get_util_window")();
    $util_window.append("<iframe id='upload_target' name='upload_target' src='' style='display: none'></iframe>").append("<div id='add_file_dialog' > <form id='file_upload_form' target='upload_target' method='post' enctype='multipart/form-data' action='SET_IN_JS_FILE'> <table> <tr><td>Group</td><td> <select id='add_file_ensemble'/></td></tr><tr><td>Folder</td><td><select id='add_file_folder'/></td></tr><tr><td>File</td><td><input type='file' name='file' id='add_file_upload' ></input></td></tr></table></form></div>").append("<div id='add_folder_dialog' > <table> <tr><td>Group</td><td> <select id='add_folder_ensemble'/></td></tr><tr><td>Parent Folder </td><td><select id='add_folder_folder'/></td></tr><tr><td>Name</td><td><input type='text'  id='add_folder_name' ></input></td></tr></table></div>").append("<div id='rename_file_dialog' ><input type='text'  id='rename_file_name' style='min-width: 24em;' ></input></div>").append("<div id='delete_folder_dialog' >Are you sure that you wish to delete the folder  <b id='delete_folder_name'/>?</div>").append("<div id='delete_file_dialog' >Are you sure that you wish to delete the file <b id='delete_file_name'/> ? <br/><i>Note: This will cause all annotations made on that file to be unusable</i></div>").append("<div id='move_file_dialog'>Move <b id='move_file_name'/> to...<br/><select id='move_file_select'/></div>").append("<div id='update_file_dialog'>Select a file...<form id='file_update_form' target='upload_target' method='post' enctype='multipart/form-data' action='SET_IN_JS_FILE'> <input type='file' name='file' id='add_file_update' ></input></form> <i>Warning</i> Proceeding will replace the current version of <b id='update_file_name'/>. As a consequence, exisiting annotations on that file may become <i>out of context</i>, especially if the file has changed a lot.</div>").append("<div id='add_ensemble_dialog' > <table> <tr><td>Name</td><td><input type='text'  id='add_ensemble_name' ></input></td></tr><tr><td>Brief Description</td><td><input type='text'  id='add_ensemble_description' ></input></td></tr>\
<tr><td><br/>Allow comments to staff ? </td>  <td><br/>  <span class='yesno'>Yes</span><input type='radio' value='1' name='allow_staffonly'/> <span class='yesno'>No</span><input type='radio' value='0' name='allow_staffonly'>No</input> </td></tr> \
<tr><td>Allow anonymous comments ? </td>   <td>  <span class='yesno'>Yes</span><input type='radio' value='1' name='allow_anonymous'/> <span class='yesno'>No</span><input type='radio' value='0' name='allow_anonymous'>No</input>        </td></tr> \
<tr><td>Allow guest access ? </td>         <td>  <span class='yesno'>Yes</span><input type='radio' value='1' name='allow_guest'/> <span class='yesno'>No</span><input type='radio' value='0' name='allow_guest'>No</input>        </td></tr> \
<tr><td>Allow users to download PDFs ? </td>         <td>  <span class='yesno'>Yes</span><input type='radio' value='1' name='allow_download'/> <span class='yesno'>No</span><input type='radio' value='0' name='allow_download'>No</input>        </td></tr> \
<tr><td>Use subscribe URL ?</td>       <td>  <span class='yesno'>Yes</span><input type='radio' value='1' name='use_invitekey'/> <span class='yesno'>No</span><input type='radio' value='0' name='use_invitekey'>No</input>        </td></tr>\
</table><br/><div><i>Once you've created a class, you can add files to it and invite users...</i></div></div>").append("<div id='invite_users_dialog' > <div>To access the following group  <select id='invite_users_ensemble'/></div><br/><span class='fixdialog' >Enter the email address(es, separated by commas) of the people to whom you wish to send this invite</span><br/><textarea id='invite_users_emails'  rows='5' cols='50'/><br/><input type='checkbox' id='invite_users_admin' style='padding-left: 20px'></input> <label for='invite_users_admin'>Grant administrative rights to these users</label><br/><br/><span class='fixdialog' ><em>Optional</em> Add a personal message (will appear on the invitation)</span><br/><textarea id='invite_users_msg'  rows='7' cols='50'/></div>").append("<div id='edit_assignment_dialog' ><span>Is this file an assignment ? </span><span class='yesno'>Yes</span><input type='radio' value='1' name='is_assignment'/> <span class='yesno'>No</span><input type='radio' value='0' name='is_assignment'>No</input><br/><br/><div id='assignment_due'><label for='due_date'>Due on</label> <input id='due_date'/> at <input id='due_time'/></div></div>");   
};


NB.files.addFile = function(id_ensemble, id_folder){
    NB.files.currentEnsemble = id_ensemble;
    NB.files.currentFolder = id_folder;
    var foldername = (id_folder == null ) ? "": NB.files.model.o.folder[NB.files.currentFolder].name;
    $("#add_file_ensemble").html("<option id_ensemble='"+NB.files.currentEnsemble+"'>"+NB.pers.store.o.ensemble[NB.files.currentEnsemble].name+"</option>").attr("disabled", "disabled");
    $("#add_file_folder").html("<option id_folder='"+NB.files.currentFolder+"'>"+foldername+"</option>").attr("disabled", "disabled");

    $('#add_file_dialog').dialog({
	    title: "Add a PDF File...", 
		width: 390,
		buttons: { 
		"Cancel": function() { 
		    $(this).dialog("close");  
		},
		    "Ok": function() { 
			$.concierge.get_component("source_id_getter")({}, NB.files.proceedUpload);
			$.I("Uploading in progress...");
		    }
	    }
	});
    $('#add_file_dialog').dialog("open");
};

NB.files.proceedUpload = function(payload){
    var form = $("#file_upload_form")[0];
    // we need a way to pass the id_ensemble and id_folder: we do it in the URL
    var folder_fragment = (NB.files.currentFolder == null) ? "" : "&id_folder="+NB.files.currentFolder;
    var newauth = ("ckey" in NB.conf.userinfo) ? "&ckey="+NB.conf.userinfo.ckey : ""; 
    form.setAttribute("action", NB.conf.servers.upload+"/pdf3/upload?id_ensemble="+NB.files.currentEnsemble+"&id_source="+ payload.id_source+folder_fragment+newauth);
    form.submit();
    //$.I("File added to remote repository");    
    $('#add_file_dialog').dialog("destroy");
    //SACHA TODO: Fix this when we setup connectionIds
    window.setTimeout(function(){
	    //NOTE (important !) 
	    $.I("NB is processing your file... You should receive an email once your file is available on NB."); 
	    var payload_objects = {types:["files"],  id: payload.id_source};
	    if ("id_ensemble" in NB.pers.params){
		payload_objects["payload"]= {id_ensemble: NB.pers.params.id_ensemble};
	    }
	    NB.pers.call("getObjects", payload_objects, function(p){
		    NB.pers.store.add("file", p.files);
		} );
	}, 3000);
};



NB.files.update_file = function(id){
    var $filename = $("#update_file_name");
    $filename.html(NB.files.model.o.file[id].title);
    $('#update_file_dialog').dialog({
	    title: "Update a PDF File...", 
		width: 390,
		buttons: { 
		"Cancel": function() { 
		    $(this).dialog("close");  
		},
		    "Ok": function() { 
			var form = $("#file_update_form")[0];
			var newauth = ("ckey" in NB.conf.userinfo) ? "&ckey="+NB.conf.userinfo.ckey : ""; 
			form.setAttribute("action", NB.conf.servers.upload+"/pdf3/upload/update?id_source="+ id+newauth);
			form.submit();
			$.I("Updating in progress...");
			$(this).dialog("destroy");  
		    }
	    }
	});
    $('#update_file_dialog').dialog("open");
};

NB.files.proceedUpdate = function(payload){
    var form = $("#file_upload_form")[0];
    // we need a way to pass the id_ensemble and id_folder: we do it in the URL
    var folder_fragment = (NB.files.currentFolder == null) ? "" : "&id_folder="+NB.files.currentFolder;
    form.setAttribute("action", NB.conf.servers.upload+"/pdf3/upload?id_ensemble="+NB.files.currentEnsemble+"&id_source="+ payload.id_source+folder_fragment);
    form.submit();
    //$.I("File updateed to remote repository");    
    $('#update_file_dialog').dialog("destroy");
    //SACHA TODO: Fix this when we setup connectionIds
    window.setTimeout(function(){
	    //NOTE (important !) 
	    $.I("NB is processing your file... You should receive an email once your file has been updated."); 
	    var payload_objects = {types:["files"],  id: payload.id_source};
	    if ("id_ensemble" in NB.pers.params){
		payload_objects["payload"]= {id_ensemble: NB.pers.params.id_ensemble};
	    }
	    NB.pers.call("getObjects", payload_objects, function(p){
		    NB.pers.store.add("file", p.files);
		} );
	}, 3000);
};




NB.files.inviteUsers = function(id_ensemble){
    NB.files.currentEnsemble = id_ensemble;
    $("#invite_users_ensemble").html("<option id_ensemble='"+NB.files.currentEnsemble+"'>"+NB.pers.store.o.ensemble[NB.files.currentEnsemble].name+"</option>").attr("disabled", "disabled");
    $('#invite_users_dialog').dialog({
	    title: "Send an invitation...", 
		width: 550,
		buttons: { 
		"Cancel": function() { 
		    $(this).dialog("close");  
		},
		    "Ok": function() { 
			var to = $("#invite_users_emails")[0].value;
			var msg = $("#invite_users_msg")[0].value;
			var admin = $("#invite_users_admin:checked").length;
			$.concierge.get_component("invite_users")({id_ensemble: id_ensemble, to: to, msg: msg, admin: admin}, function(){$.I("Your invitation has been sent !");})
			$(this).dialog("destroy");
		    }
	    }
	});
    $('#invite_users_dialog').dialog("open");
};



NB.files.addEnsemble = function(){
    //defaults: 
    $("input[name=allow_staffonly][value=1]")[0].checked="true";
    $("input[name=allow_anonymous][value=1]")[0].checked="true";
    $("input[name=allow_guest][value=0]")[0].checked="true";
    $("input[name=allow_download][value=1]")[0].checked="true";
    $("input[name=use_invitekey][value=1]")[0].checked="true";
    $('#add_ensemble_dialog').dialog({
	    title: "Create a new class...", 
		width: 540,
		buttons: { 
		"Cancel": function() { 
		    $(this).dialog("close");  
		},
		    "Ok": function() { 
			$.concierge.get_component("add_ensemble")({name: $("#add_ensemble_name")[0].value, description: $("#add_ensemble_description")[0].value, allow_staffonly:$("input[name=allow_staffonly]:checked")[0].value==1, allow_anonymous: $("input[name=allow_anonymous]:checked")[0].value==1, allow_guest: $("input[name=allow_guest]:checked")[0].value==1,  allow_download: $("input[name=allow_download]:checked")[0].value==1, use_invitekey: $("input[name=use_invitekey]:checked")[0].value==1 }, function(p){NB.files.model.add("ensemble", p);$.I("Class created !");} );
			$(this).dialog("destroy");
		    }
	    }
	});
    $('#add_ensemble_dialog').dialog("open");
};





NB.files.addFolder = function(id_ensemble, id_folder){
    NB.files.currentEnsemble = id_ensemble;
    NB.files.currentFolder = id_folder;
    var foldername = (id_folder == null ) ? "": NB.files.model.o.folder[NB.files.currentFolder].name;
    $("#add_folder_ensemble").html("<option id_ensemble='"+NB.files.currentEnsemble+"'>"+NB.pers.store.o.ensemble[NB.files.currentEnsemble].name+"</option>").attr("disabled", "disabled");
    //    $("#add_file_folder").html("<option id_folder='"+NB.files.currentFolder+"'>"+NB.pers.store.o.folder[NB.files.currentFolder].name+"</option>").attr("disabled", "disabled");
    $("#add_folder_folder").html("<option id_folder='"+NB.files.currentFolder+"'>"+foldername+"</option>").attr("disabled", "disabled");

    $('#add_folder_dialog').dialog({
	    title: "Add a Folder...", 
		width: 390,
		buttons: { 
		"Cancel": function() { 
		    $(this).dialog("close");  
		},
		    "Ok": function() { 
			$.concierge.get_component("add_folder")({id_parent: id_folder, id_ensemble: id_ensemble, name: $("#add_folder_name")[0].value}, function(p){NB.files.model.add("folder", p);$.I("folder added");} );
			$(this).dialog("destroy");
		    }
	    }
	});
    $('#add_folder_dialog').dialog("open");
};

NB.files.edit_assignment = function(id){
    var f =  NB.files.model.o.file[id]
    //controls: 
    var assignment_ref = f.assignment ? "1" : "0";
    var checkboxes = $("input[name=is_assignment]");
    var f_checkbox = function(){
	var v = checkboxes.filter(":checked")[0].value;
	$("#assignment_due")[v=="1"? "show":"hide"]();
    }
    checkboxes.click(f_checkbox);
    checkboxes.filter("[value="+assignment_ref+"]")[0].checked="true";
    f_checkbox();     
    if (f.due!=null){
	$('#due_date')[0].value = f.due.substring(7,5)+"/"+f.due.substring(10,8)+"/"+f.due.substring(4,0);
	$('#due_time')[0].value = f.due.substring(13,11)+":"+f.due.substring(16,14);
    }   
    $('#edit_assignment_dialog').dialog({
	    title: "Assignment Properties for "+$.E(f.title), 
	    width: 600,
		height: 380,
	    buttons: { 
		"Cancel": function() { 
		    $(this).dialog("close");  
		},
		"Ok": function() { 
		    var v_date = $('#due_date')[0].value;
		    var v_time = $('#due_time')[0].value;

		    //TODO: validate form
		    var due_datetime = v_date == "" ? null : v_date.substring(10, 6)+"-"+v_date.substring(2, 0)+"-"+v_date.substring(5, 3)+" "+v_time.substring(2,0)+":"+v_time.substring(5,3);
		    
		    $('#due_date')[0].value
		    $.concierge.get_component("edit_assignment")({id: id, assignment:  $("input[name=is_assignment]:checked")[0].value=="1", due:due_datetime}, function(p){NB.files.model.add("file", p.files);$.I("Changes Saved");} );
		    $(this).dialog("destroy");
		}
	    }
	});
    $('#edit_assignment_dialog').dialog("open");
    $('#due_date').calendricalDate({usa: true,  isoTime: true, two_digit_mdh: true});
    $('#due_time').calendricalTime({usa: true,  isoTime: true, two_digit_mdh: true, meridiemUpperCase: true});
}
    
NB.files.rename_file = function(id, item_type){
    var $filename = $("#rename_file_name");
    $filename[0].value =  (item_type==="file")? NB.files.model.o.file[id].title :  NB.files.model.o.folder[id].name;
    $('#rename_file_dialog').dialog({
	    title: "Rename "+item_type+"...", 
		width: 390,
		buttons: { 
		"Cancel": function() { 
		    $(this).dialog("close");  
		},
		    "Ok": function() { 
			$.concierge.get_component("rename_file")({item_type: item_type, id: id, title:  $filename[0].value}, function(p){NB.files.model.add(item_type, p[item_type+"s"]);$.I(item_type+" renamed");} );
			$(this).dialog("destroy");
		    }
	    }
	});
    $('#rename_file_dialog').dialog("open");
    $filename.focus();
};



NB.files.delete_file = function(id, item_type){
    var m = NB.pers.store;
    if (item_type==="folder" && (!m.get("file", {id_folder: id}).is_empty() || !m.get("folder", {id_parent: id}).is_empty())){
	alert("This folder isn't empty. You can only delete folders that are empty.");
	return;
    }
    var $filename = $("#delete_"+item_type+"_name");
    $filename.text((item_type==="file")? NB.files.model.o.file[id].title :  NB.files.model.o.folder[id].name);
    $('#delete_'+item_type+'_dialog').dialog({
	    title: "Delete "+item_type+"...", 
		width: 390,
		buttons: { 
		"Cancel": function() { 
		    $(this).dialog("close");  
		},
		    "Ok": function() { 
			$.concierge.get_component("delete_file")({id: id, item_type: item_type}, function(P){NB.files.model.remove(item_type, P["id"]);$.I(item_type+" deleted");} );
			$(this).dialog("destroy");
		    }
	    }
	});
    $('#delete_'+item_type+'_dialog').dialog("open");
};

NB.files.__abspath = function(id_folder){
    var m = NB.files.model;
    var f = m.o.folder[id_folder];
    var id_parent = f.id_parent;
    var s = f.name;
    var p;
    while (id_parent != null){
	p = m.o.folder[id_parent];
	s = p.name + "/" + s;
	id_parent = p.id_parent;
    }
    s = NB.files.model.o.ensemble[f.id_ensemble].name + "/" + s; 
    return s;
};

NB.files.__generate_folders = function(id_ensemble, id_sel){
    var subfolders  = NB.files.model.get("folder", {id_ensemble:id_ensemble }); 
    var sel_str = (id_sel==null) ? " selected='selected' ": " ";
    var s="<option "+sel_str+" id_item='0'>"+NB.files.model.o.ensemble[id_ensemble].name+"</option>";
    for (var i in subfolders.items){ 
	sel_str = (i==id_sel ) ? " selected='selected' ": " ";
	s+="<option "+sel_str+" id_item='"+i+"'>"+NB.files.__abspath(i)+"</option>";
    }
    return s;
};

NB.files.move_file = function(id){  
    var $filename = $("#move_file_name");
    $filename.text(NB.files.model.o.file[id].title);
    $select = $("#move_file_select");
    $select.html(NB.files.__generate_folders(NB.files.model.o.file[id].id_ensemble,NB.files.model.o.file[id].id_folder));
    $('#move_file_dialog').dialog({
	    title: "Move file...", 
		width: 390,
		buttons: { 
		"Cancel": function() { 
		    $(this).dialog("close");  
		},
		    "Ok": function() { 
			$.concierge.get_component("move_file")({id: id, dest:  parseInt($select.children(":selected").attr("id_item"))||null}, function(p){NB.files.model.add("file", p.files);$.I("file moved");} );
			$(this).dialog("destroy");
		    }
	    }
	});
    $('#move_file_dialog').dialog("open");
};

