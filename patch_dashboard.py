import re

with open('src/components/Dashboard.tsx', 'r') as f:
    code = f.read()

target = "const ROVER_MEMBERS_LIST = ["

replacement = """import { subscribeToMembers } from '../services/membersService';
import { MemberItem } from '../components/MembersPage';

const INITIAL_ROVER_MEMBERS_LIST = ["""

code = code.replace(target, replacement)

# We need to add state for ROVER_MEMBERS_LIST
target_state = "  const [councilRoles, setCouncilRoles] = useState<CouncilRoleAssignment[]>(() => {"
replacement_state = """  const [roverMembersList, setRoverMembersList] = useState<string[]>(INITIAL_ROVER_MEMBERS_LIST);
  React.useEffect(() => {
    const unsub = subscribeToMembers((members: MemberItem[]) => {
      if (members && members.length > 0) {
        const list = members.map(m => `${m.name} (${m.patrol})`);
        setRoverMembersList(list.length > 0 ? list : INITIAL_ROVER_MEMBERS_LIST);
      }
    }, console.error);
    return () => unsub();
  }, []);

  const [councilRoles, setCouncilRoles] = useState<CouncilRoleAssignment[]>(() => {"""

code = code.replace(target_state, replacement_state)

# Replace all ROVER_MEMBERS_LIST usage inside component with roverMembersList
target_list_1 = "useState(ROVER_MEMBERS_LIST[0])"
replacement_list_1 = "useState(roverMembersList[0] || '')"
code = code.replace(target_list_1, replacement_list_1)

target_list_2 = "const match = ROVER_MEMBERS_LIST.find(r => r.startsWith(role.assignedRoverName));"
replacement_list_2 = "const match = roverMembersList.find(r => r.startsWith(role.assignedRoverName));"
code = code.replace(target_list_2, replacement_list_2)

target_list_3 = "setEditSelectedRover(match || ROVER_MEMBERS_LIST[0]);"
replacement_list_3 = "setEditSelectedRover(match || roverMembersList[0] || '');"
code = code.replace(target_list_3, replacement_list_3)

target_list_4 = "{ROVER_MEMBERS_LIST.map((rover, idx) => ("
replacement_list_4 = "{roverMembersList.map((rover, idx) => ("
code = code.replace(target_list_4, replacement_list_4)

with open('src/components/Dashboard.tsx', 'w') as f:
    f.write(code)
