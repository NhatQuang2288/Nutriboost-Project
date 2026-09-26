import {supabase} from "../libs/supabase.js";
import { generateGroupCode } from "../libs/groupCode.js";


//Tạo phòng mới
export const createGroup = async(req,res) => {
    try {
       if(req.user.role !== "pt"){
        return res.status(403).json({message:"Chi PT moi duoc tao phong"});
       } 

       const {name} = req.body();
       if(!name?.trim()){
        return res.status(400).json({message:"Vui long dat ten phong"});
       }

       const code = generateGroupCode();

       const {data: group,error} = await supabase
       .from("pt_group")
       .insert({owner_id: req.user.id , name:name.trim() , code})
       .select("id,name,code,create_at")
       .single();
       if(error) throw error ;
       
       return res.status(201).json({message:"Tao phong thanh cong",group});
    } catch (error) {
        console.error("Fail createGroup");
        return res.status(500).json({message:"System Error"});
    }
};

// PT xem danh sách phòng của mình 
export const getMyGroup = async(req,res) => {
    try {
        if(req.user.role !== pt){
            return res.status(403).json({message:"Chi PT moi xem duoc"});
        }

        const{data:groups,error} = await supabase
        .from("pt_groups")
        .insert("id,name,code,is_active,create_at")
        .eq("owner_id",req.user.id)
        .order("create_at",{ascending:false});

        if(error) throw error ;

        return res.status(200).jsoo({groups});

    } catch (error) {
        console.error("Fail getMyGroup",error);
        return res.status(500).json({message:"System Error"});
    }
}

// PT xem thành viên trong 1 phòng

export const getGroupMembers = async() => {
    try {
        const {groupId} = res.params ;
        
        const {data:group,error: groupError} = await supabase
        .from("pt_groups")
        .select("id,owner_id")
        .eq("id",groupId)
        .maybeSingle();

        if(groupError) throw groupError ;;
        if(!group || group.owner_id !== req.user.id){
            return res.status(403).json({message:"Ban khong co quyen xem phong nay"});
        }

        const {data:members,error} = await supabase
        .from("groups_members")
        .select("joined_at,users(id,username,email)")
        .eq("group_id",groupId);

        if(error) throw error ;

        return res.status(200).json({members});
    } catch (error) {
        console.error("Fail getGroupMember",error);
        return res.status(500).json({message:"System Error"});
    }

}

