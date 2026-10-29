import { BrowserRouter, Routes, Route, Link, Navigate as RouterNavigate, useParams, useNavigate, useLocation } from "react-router-dom";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import "./index.css";
import { api, fromApiEvent, toApiEvent } from "./api.js";

const AppContext = createContext(null);
const useApp = () => useContext(AppContext);
const categories = ["Technology", "Cultural", "Music", "Workshop", "Sports"];

function Navbar({ active = "" }) {
  const { user, logout } = useApp();
  const isAdmin = Boolean(user?.admin);
  return <header className="site-header"><nav className={`navbar ${isAdmin ? "navbar-admin" : ""}`}>
    <Link to={isAdmin ? "/admin" : "/"} className="brand"><span className="brand-spark">✧</span> Evently</Link>
    <div className="nav-links">
      {isAdmin ? <>
        <Link className={active === "admin" ? "nav-active" : ""} to="/admin">Dashboard</Link>
        <Link className={active === "admin-events" ? "nav-active" : ""} to="/admin/events">Manage Events</Link>
        <Link className={active === "admin-registrations" ? "nav-active" : ""} to="/admin/registrations">Registrations</Link>
        <Link className={active === "admin-users" ? "nav-active" : ""} to="/admin/users">Users</Link>
      </> : <>
        <Link className={active === "home" ? "nav-active" : ""} to="/">Home</Link>
        <Link className={active === "events" ? "nav-active" : ""} to="/events">Events</Link>
        {user && <><Link className={active === "mine" ? "nav-active" : ""} to="/my-events">My Events</Link><Link className={active === "registrations" ? "nav-active" : ""} to="/my-registrations">My Registrations</Link></>}
      </>}
    </div>
    {user ? <div className="nav-user">{!isAdmin && <Link to="/events/new" className="button-primary nav-create-event">＋ Create Event</Link>}<span className="avatar">{(user.name || "U").slice(0,1).toUpperCase()}</span><span className="nav-user-name">{user.name || "Student"}</span><button className="header-signin" onClick={logout}>Log out</button></div> : <Link to="/signin" className="header-signin">Sign in</Link>}
  </nav></header>;
}
function EventArtwork({ event, large = false }) {
  return <div className={`event-art art-${event.visual || "calendar"} ${event.visual === "concert" ? "event-art-concert" : ""} ${large ? "event-art-large" : ""}`}>
    {event.banner ? <img src={event.banner} alt={event.title}/> : event.visual === "concert" ? <img src="https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=1200&q=85" alt="Concert lights and crowd"/> : <span className={`art-symbol art-symbol-${event.visual || "calendar"}`}>{event.visual === "masks" ? "🎭" : event.visual === "wellness" ? "🌿" : "✦"}</span>}
    <span className={`art-status ${event.registrationOpen ? "art-status-upcoming" : ""}`}><i />{event.status}</span>
  </div>;
}
function EventCard({ event }) {
  const open = !isRegistrationClosed(event, Date.now());
  return <article className="event-card"><Link className="event-card-art-link" to={`/events/${event.id}`} aria-label={`View ${event.title}`}><EventArtwork event={{...event, registrationOpen:open}}/></Link><div className="event-card-body"><span className={`category-chip ${event.category.toLowerCase()}`}>{event.category}</span><h3>{event.title}</h3><p className="event-meta"><span className="meta-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M7.5 3v4M16.5 3v4M4 9.5h16"/></svg></span>{event.date}</p><p className="event-meta"><span className="meta-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>{event.venue}</p><div className="event-card-separator"/><div className="event-card-status-row"><span className={open ? "seats-open" : "seats-closed"}>{open ? `${Math.max(0,event.seats||0)} seats available` : "Registration closed"}</span><span className={`status-pill ${open ? "pill-open" : "pill-closed"}`}><i/>{open ? "Open" : "Closed"}</span></div><Link className="view-details-link" to={`/events/${event.id}`}>View Details <span>›</span></Link></div></article>;
}
function Home() {
  const { events, user } = useApp();
  const upcoming = events.filter(e => e.status === "Upcoming").slice(0,3);
  return <div className="app-shell"><Navbar active="home"/><main className="home-main"><section className="hero-panel"><p className="eyebrow">CAMPUS EVENTS, MINUS THE CLUTTER</p><h1>{user ? `Your next campus moment starts here, ${user.name.split(" ")[0]}` : "Find your next campus moment"} <span>✦</span></h1><p className="hero-copy">Discover what's happening around campus, meet new people, and make<br className="desktop-break"/> memories that last beyond the semester.</p><div className="hero-actions"><Link to={user ? "/my-events" : "/signin"} className="button-primary">{user ? "Go to dashboard" : "Sign in to get started"}</Link><Link to="/events" className="button-secondary">Browse events</Link></div><div className="hero-mini-stats"><span><b>{events.filter(e=>e.status==="Upcoming").length}</b> upcoming events</span><span><b>✧</b> made for campus life</span></div></section><section className="home-upcoming"><div className="section-title-row"><div><p className="eyebrow">SAVE YOUR SPOT</p><h2>Upcoming Events</h2></div><Link to="/events" className="view-all">View all <span>→</span></Link></div><div className="home-event-grid">{upcoming.map(event=><EventCard key={event.id} event={event}/>)}</div></section><section className="home-cta"><div><p className="eyebrow">YOUR CAMPUS, YOUR COMMUNITY</p><h2>There's always something happening.</h2><p>Find a workshop, cheer at a show, or meet people who share your interests.</p></div><Link className="button-primary" to="/events">Explore all events <span>→</span></Link></section></main><Footer/></div>;
}
function Events() {
  const { events } = useApp(); const [search,setSearch]=useState(""); const [category,setCategory]=useState(""); const [status,setStatus]=useState(""); const [registration,setRegistration]=useState("");
  const filtered=useMemo(()=>events.filter(event=>{const q=search.trim().toLowerCase();return (!q||`${event.title} ${event.category} ${event.venue} ${event.host}`.toLowerCase().includes(q))&&(!category||event.category===category)&&(!status||event.status===status)&&(!registration||(registration==="Open"?event.registrationOpen:!event.registrationOpen))}),[events,search,category,status,registration]);
  return <div className="app-shell"><Navbar active="events"/><main className="events-main"><section className="events-intro"><p className="eyebrow">EXPLORE YOUR CAMPUS</p><h1>Find your next event</h1><p>Discover something interesting happening around campus.</p></section><section className="event-search-controls"><label className="search-input-wrap"><span>⌕</span><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search events, categories, venues..."/></label><div className="filter-row"><select value={category} onChange={e=>setCategory(e.target.value)} aria-label="Filter by category"><option value="">All categories</option>{categories.map(c=><option key={c}>{c}</option>)}</select><select value={status} onChange={e=>setStatus(e.target.value)} aria-label="Filter by event status"><option value="">All event dates</option><option>Upcoming</option><option>Completed</option></select><select value={registration} onChange={e=>setRegistration(e.target.value)} aria-label="Filter by registration"><option value="">Registration: all</option><option>Open</option><option>Closed</option></select><button className="button-quiet" onClick={()=>{setSearch("");setCategory("");setStatus("");setRegistration("")}}>Clear filters</button></div></section><p className="results-count">Showing <b>{filtered.length}</b> {filtered.length===1?"event":"events"}</p><section className="events-grid">{filtered.map(event=><EventCard key={event.id} event={event}/>)}{filtered.length===0&&<div className="empty-state"><span>✧</span><h3>No events found</h3><p>Try changing your search or clearing the filters.</p><button className="button-secondary" onClick={()=>{setSearch("");setCategory("");setStatus("");setRegistration("")}}>Clear filters</button></div>}</section></main><Footer/></div>;
}
function getDeadlineTime(event){
  if(event?.deadlineInput){const value=new Date(event.deadlineInput).getTime();if(!Number.isNaN(value))return value;}
  if(event?.deadline){const value=new Date(String(event.deadline).replace("•", " ")).getTime();if(!Number.isNaN(value))return value;}
  return null;
}
function isRegistrationClosed(event, now=Date.now()){
  const deadline=getDeadlineTime(event);
  return !event?.registrationOpen || Number(event?.seats ?? 0)<=0 || (Number(event?.capacity)>0 && Number(event?.registered ?? 0)>=Number(event.capacity)) || (deadline!==null && now>=deadline);
}
function getGoogleFormEmbedUrl(url){
  if(!url)return "";
  try{
    const parsed=new URL(url);
    if(parsed.hostname.includes("docs.google.com") && parsed.pathname.includes("/forms/")){
      parsed.searchParams.set("embedded", "true");
      return parsed.toString();
    }
    return url;
  }catch{return url;}
}
function EventDetails(){
  const {eventId}=useParams();
  const {events,user,registerForEvent,registrations}=useApp();
  const navigate=useNavigate();
  const [now,setNow]=useState(Date.now());
  useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),1000);return ()=>clearInterval(timer);},[]);
  const event=events.find(item=>item.id===eventId);
  if(!event)return <div className="app-shell"><Navbar/><main className="empty-page"><h1>Event not found</h1><Link to="/events" className="button-primary">Back to events</Link></main><Footer/></div>;
  const registered=registrations.includes(event.id);
  const closed=isRegistrationClosed(event,now);
  const deadlineTime=getDeadlineTime(event);
  const formUrl=getGoogleFormEmbedUrl(event.googleForm);
  const embeddable=Boolean(event.googleForm);
  function handleRegister(){
    if(isRegistrationClosed(event,Date.now())){setNow(Date.now());return;}
    if(!user){navigate("/signin",{state:{from:`/events/${event.id}`}});return;}
    registerForEvent(event.id);
  }
  return <div className="app-shell"><Navbar active="events"/><main className="details-main"><Link to="/events" className="details-back">← All events</Link><section className="details-top"><EventArtwork event={{...event,registrationOpen:!closed}} large/><div className="details-summary"><div className="details-tags"><span>{event.category}</span><i>●</i><span>{event.status}</span></div><h1>{event.title}</h1><div className="details-meta"><p><span className="meta-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M7.5 3v4M16.5 3v4M4 9.5h16"/></svg></span>{event.fullDate}</p><p><span className="meta-icon">◷</span>{event.time}</p><p><span className="meta-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>{event.venue}</p><p><span className="meta-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>{event.campus}</p><p><span className="meta-icon">♙</span>Hosted by {event.host}</p></div><div className="registration-panel"><p className="registration-heading">REGISTRATION</p><div className="registration-row"><span>Registration status</span><b className={`status-pill ${closed?"pill-closed":"pill-open"}`}><i/>{closed?"Registration closed":"Open"}</b></div><div className="registration-row"><span>Seats available</span><strong>{Math.max(0,event.seats||0)}</strong></div><div className="registration-row"><span>Registered</span><strong>{event.registered} / {event.capacity}</strong></div><div className="registration-row"><span>Registration deadline</span><strong>{event.deadline}</strong></div>
    {event.googleForm && <section className="google-form-section"><h3 className="google-form-title">Google Form</h3><p className="google-form-instruction">Please fill the Google Form to complete your event registration.</p><a className="google-form-open-link google-form-url" href={event.googleForm} target="_blank" rel="noreferrer">{event.googleForm}</a></section>}
    {registered?<button className="register-button registered-button" onClick={()=>navigate("/my-registrations")}>✓ You're registered — view registrations</button>:closed?<button className="register-button register-disabled" disabled>Registration closed</button>:<button className="register-button" onClick={handleRegister}>{user?"Confirm registration":"Sign in to register"}</button>}{deadlineTime!==null && !closed && <p className="form-note">Registration closes at {new Date(deadlineTime).toLocaleString("en-US",{hour:"numeric",minute:"2-digit",month:"short",day:"numeric",year:"numeric"})}.</p>}{!user&&!registered&&!closed&&<p className="form-note">Sign in first to save your registration.</p>}</div></div></section><section className="details-bottom"><article className="details-about"><h2>About this event</h2><p>{event.description}</p></article><article className="details-info"><h2>Event information</h2><div className="details-info-grid"><div><label>HOST</label><p>{event.host}</p></div><div><label>MAXIMUM CAPACITY</label><p>{event.capacity}</p></div><div><label>REGISTERED USERS</label><p>{event.registered}</p></div><div><label>REGISTRATION DEADLINE</label><p>{event.deadline}</p></div></div></article></section></main><Footer/></div>
}
function AuthPage({admin=false}) {
  const [signUp,setSignUp]=useState(false);
  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [password,setPassword]=useState("");
  const [showPassword,setShowPassword]=useState(false);
  const [error,setError]=useState("");
  const [success,setSuccess]=useState("");
  const {login}=useApp();
  const navigate=useNavigate();
  const location=useLocation();

  async function submit(e){
    e.preventDefault();
    setError("");
    setSuccess("");
    const signingUp=signUp&&!admin;
    try {
      const result=await api(admin?"/auth/login":signingUp?"/auth/signup":"/auth/login",{
        method:"POST",
        body:JSON.stringify(signingUp?{name,email,password}:{email,password})
      });
      if(signingUp){
        setPassword("");
        setSignUp(false);
        setSuccess("Account created successfully! Please sign in.");
        return;
      }
      if(admin&&result.user.role!=="admin")throw new Error("This account does not have administrator access.");
      if(!admin&&result.user.role==="admin")throw new Error("Please use the administrator login page.");
      login(result);
      navigate(location.state?.from||(admin?"/admin":"/"),{replace:true});
    } catch(err) {
      setError(err.message||"Could not connect to the backend.");
    }
  }

  return <div className="app-shell"><Navbar/><main className="auth-main"><div className="auth-layout"><div className="auth-side"><div className="auth-side-mark">✧</div><p className="eyebrow">WELCOME TO EVENTLY</p><h2>Make campus life<br/>a little more <em>eventful.</em></h2><p>Find your people, discover new interests, and keep every campus moment in one place.</p><div className="auth-side-decoration"><span>✦</span><span>✧</span><span>✷</span></div></div><form className="auth-card" onSubmit={submit}><div className="auth-logo">✧</div><h1>{admin?"Administrator Login":signUp?"Create your account":"Welcome back"}</h1><p>{admin?"Sign in to manage campus events.":signUp?"Create an account to start joining campus events.":"Sign in to register for events and host your own."}</p>{!admin&&<div className="auth-switch"><button type="button" className={!signUp?"selected":""} onClick={()=>{setSignUp(false);setError("");setSuccess("")}}>Sign In</button><button type="button" className={signUp?"selected":""} onClick={()=>{setSignUp(true);setError("");setSuccess("")}}>Sign Up</button></div>}{signUp&&!admin&&<label>Full name<input value={name} onChange={e=>setName(e.target.value)} required placeholder="Enter your full name" autoComplete="name"/></label>}<label>{admin?"Admin email":"Email address"}<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="you@example.com" autoComplete="email"/></label><label>Password<div className="password-wrap"><input type={showPassword?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} required minLength={signUp&&!admin?8:1} placeholder="Enter your password" autoComplete={signUp?"new-password":"current-password"}/><button type="button" onClick={()=>setShowPassword(v=>!v)}>{showPassword?"Hide":"Show"}</button></div></label>{error&&<p className="form-error" role="alert">{error}</p>}{success&&<p className="form-note" role="status">{success}</p>}<button className="button-primary auth-submit">{admin?"Sign in as admin":signUp?"Create account":"Sign in"}<span>→</span></button><p className="auth-switch-bottom">{admin?"Looking for student sign in? ":"Are you an administrator? "}<Link to={admin?"/signin":"/admin-login"}>{admin?"Student login":"Admin login"}</Link></p></form></div></main><Footer/></div>;
}
function DashboardLayout({active,eyebrow,title,subtitle,children,actions}){return <div className="app-shell"><Navbar active={active}/><main className="dashboard-main"><div className="dashboard-heading"><div><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{subtitle}</p></div>{actions}</div>{children}</main><Footer/></div>}
function MyEvents(){
  const {user,events,deleteEvent}=useApp();
  const navigate=useNavigate();
  if(!user)return <RouterNavigate to="/signin" replace/>;
  const mine=events.filter(e=>e.ownerEmail===user.email);
  return <div className="app-shell"><Navbar active="mine"/><main className="dashboard-main my-events-page">
    <div className="my-events-heading"><div><h1>My Events</h1><p>Events you've created and manage.</p></div><Link to="/events/new" className="button-primary">＋ Create Event</Link></div>
    {mine.length ? <><div className="my-events-toolbar"><span>{mine.length} {mine.length===1?"event":"events"} created</span></div><div className="my-created-events-grid">{mine.map(e=><article className="my-created-event-card" key={e.id}><EventArtwork event={e}/><div className="my-created-event-body"><span className={`category-chip ${e.category.toLowerCase()}`}>{e.category}</span><h2>{e.title}</h2><p><span className="meta-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M7.5 3v4M16.5 3v4M4 9.5h16"/></svg></span>{e.fullDate || e.date}</p><p><span className="meta-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span>{e.venue}{e.location ? ` · ${e.location}` : ""}</p><div className="created-event-footer"><span className="status-pill pill-open"><i/> {e.registered||0} registered</span><div><button className="button-secondary" onClick={()=>navigate(`/events/${e.id}/edit`)}>Edit</button><button className="text-danger" onClick={()=>{if(window.confirm(`Delete “${e.title}”?`))deleteEvent(e.id)}}>Delete</button></div></div><Link to={`/events/${e.id}`} className="view-details-link">View event →</Link></div></article>)}</div></> : <div className="created-events-empty"><span className="created-events-icon">♧</span><h2>You haven't created any events yet</h2><p>Your workshops, fests and meetups will live here — with<br className="desktop-break"/> edit and delete controls only you can see.</p><Link to="/events/new" className="button-primary">＋ Create your first event</Link></div>}
  </main><Footer/></div>
}
function MyRegistrations(){const {user,events,registrations,cancelRegistration}=useApp();const [filter,setFilter]=useState("All");if(!user)return <RouterNavigate to="/signin" replace/>;const mine=events.filter(e=>registrations.includes(e.id)).filter(e=>filter==="All"||(filter==="Upcoming"&&e.status==="Upcoming")||(filter==="Completed"&&e.status==="Completed"));return <DashboardLayout active="registrations" eyebrow="YOUR ACTIVITY" title="My Registrations" subtitle="Keep track of the events you've signed up for."><div className="toolbar-row"><span>{mine.length} {mine.length===1?"registration":"registrations"}</span><div className="segmented-filter">{["All","Upcoming","Completed"].map(f=><button key={f} className={filter===f?"active":""} onClick={()=>setFilter(f)}>{f}</button>)}</div></div>{mine.length?<div className="registration-list">{mine.map(e=><article className="registration-item" key={e.id}><EventArtwork event={e}/><div className="registration-item-copy"><span className={`category-chip ${e.category.toLowerCase()}`}>{e.category}</span><h3>{e.title}</h3><p><span className="meta-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5" width="17" height="16" rx="2.5"/><path d="M7.5 3v4M16.5 3v4M4 9.5h16"/></svg></span> {e.fullDate}　 ·　<span className="meta-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/></svg></span> {e.venue}</p><span className={`status-pill ${e.status==="Upcoming"?"pill-open":"pill-closed"}`}><i/>{e.status}</span></div><div className="registration-item-actions"><Link className="button-secondary" to={`/events/${e.id}`}>View event</Link>{e.status==="Upcoming"&&<button className="text-danger" onClick={()=>cancelRegistration(e.id)}>Cancel registration</button>}</div></article>)}</div>:<div className="empty-state"><span>♡</span><h3>No registrations here</h3><p>When you register for an event, it will appear on this page.</p><Link className="button-primary" to="/events">Find an event</Link></div>}</DashboardLayout>}
function AdminDashboard(){const {user,events,deleteEvent}=useApp();const navigate=useNavigate();if(!user?.admin)return <RouterNavigate to="/admin-login" replace/>;return <DashboardLayout active="admin" eyebrow="EVENTLY ADMIN" title="Event dashboard" subtitle="Manage campus activities and keep your community in the loop." actions={<Link to="/admin/events/new" className="button-primary">＋ Create event</Link>}><div className="dashboard-stats"><div className="stat-card"><span className="stat-icon pink">▦</span><div><b>{events.length}</b><span>Total events</span></div></div><div className="stat-card"><span className="stat-icon purple">✧</span><div><b>{events.filter(e=>e.status==="Upcoming").length}</b><span>Upcoming events</span></div></div><div className="stat-card"><span className="stat-icon peach">♙</span><div><b>{events.reduce((n,e)=>n+e.registered,0)}</b><span>Registrations</span></div></div></div><section className="dashboard-section"><div className="section-title-row"><div><h2>Manage events</h2><p>Create, update, or remove campus events.</p></div><span className="admin-demo-tag">Live data</span></div><div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Event</th><th>Date</th><th>Registrations</th><th>Status</th><th>Actions</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td><div className="table-event"><span className="table-event-icon">✧</span><div><b>{e.title}</b><small>{e.category} · {e.venue}</small></div></div></td><td>{e.fullDate}</td><td>{e.registered} / {e.capacity}</td><td><span className={`status-pill ${e.status==="Upcoming"?"pill-open":"pill-closed"}`}><i/>{e.status}</span></td><td><div className="table-actions"><button onClick={()=>navigate(`/admin/events/${e.id}/edit`)}>Edit</button><button className="text-danger" onClick={()=>{if(window.confirm(`Delete “${e.title}” ?`))deleteEvent(e.id)}}>Delete</button></div></td></tr>)}</tbody></table></div></section><p className="form-note">Event and registration data is synced with the backend.</p></DashboardLayout>}

function AdminManageEvents(){
  const {user,events,deleteEvent}=useApp();
  const navigate=useNavigate();
  if(!user?.admin)return <RouterNavigate to="/admin-login" replace/>;
  return <DashboardLayout active="admin-events" eyebrow="EVENTLY ADMIN" title="Manage events" subtitle="Create, edit, and remove campus events." actions={<Link to="/admin/events/new" className="button-primary">＋ Create event</Link>}>
    <section className="dashboard-section admin-page-section"><div className="section-title-row"><div><h2>All campus events</h2><p>{events.length} events in your event list.</p></div><span className="admin-demo-tag">Live data</span></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Event</th><th>Date</th><th>Registrations</th><th>Status</th><th>Actions</th></tr></thead><tbody>{events.map(e=><tr key={e.id}><td><div className="table-event"><span className="table-event-icon">✧</span><div><b>{e.title}</b><small>{e.category} · {e.venue}</small></div></div></td><td>{e.fullDate || e.date}</td><td>{e.registered || 0} / {e.capacity}</td><td><span className={`status-pill ${e.status==="Upcoming"?"pill-open":"pill-closed"}`}><i/>{e.status}</span></td><td><div className="table-actions"><button onClick={()=>navigate(`/admin/events/${e.id}/edit`)}>Edit</button><button className="text-danger" onClick={()=>{if(window.confirm(`Delete “${e.title}”?`))deleteEvent(e.id)}}>Delete</button></div></td></tr>)}</tbody></table></div>
    </section><p className="form-note admin-note">Event changes are saved to the backend.</p>
  </DashboardLayout>;
}
function AdminRegistrations(){
  const {user,events}=useApp();
  if(!user?.admin)return <RouterNavigate to="/admin-login" replace/>;
  const total=events.reduce((sum,event)=>sum+Number(event.registered||0),0);
  return <DashboardLayout active="admin-registrations" eyebrow="EVENTLY ADMIN" title="Registrations" subtitle="Review registration totals and capacity across campus events.">
    <div className="dashboard-stats"><div className="stat-card"><span className="stat-icon pink">♙</span><div><b>{total}</b><span>Total registrations</span></div></div><div className="stat-card"><span className="stat-icon purple">▦</span><div><b>{events.length}</b><span>Events tracked</span></div></div><div className="stat-card"><span className="stat-icon peach">♡</span><div><b>{events.reduce((sum,event)=>sum+Math.max(0,Number(event.capacity||0)-Number(event.registered||0)),0)}</b><span>Remaining capacity</span></div></div></div>
    <section className="dashboard-section admin-page-section"><div className="section-title-row"><div><h2>Registration overview</h2><p>Registration totals are shown per event.</p></div><span className="admin-demo-tag">Summary view</span></div>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Event</th><th>Registered</th><th>Capacity</th><th>Available seats</th><th>Registration</th></tr></thead><tbody>{events.map(event=>{const count=Number(event.registered||0);const capacity=Number(event.capacity||0);const closed=isRegistrationClosed(event);return <tr key={event.id}><td><div className="table-event"><span className="table-event-icon">✧</span><div><b>{event.title}</b><small>{event.category} · {event.fullDate||event.date}</small></div></div></td><td>{count}</td><td>{capacity}</td><td>{Math.max(0,Number(event.seats??(capacity-count)))}</td><td><span className={`status-pill ${closed?"pill-closed":"pill-open"}`}><i/>{closed?"Closed":"Open"}</span></td></tr>})}</tbody></table></div>
    </section><p className="form-note admin-note">Registration totals are read from student registration records.</p>
  </DashboardLayout>;
}
function AdminUsers(){
  const {user}=useApp();
  const [users,setUsers]=useState([]);
  const [error,setError]=useState("");
  useEffect(()=>{if(user?.admin)api("/auth/users").then(setUsers).catch(err=>setError(err.message));},[user]);
  if(!user?.admin)return <RouterNavigate to="/admin-login" replace/>;
  return <DashboardLayout active="admin-users" eyebrow="EVENTLY ADMIN" title="Users" subtitle="Accounts registered with Evently.">
    <section className="dashboard-section admin-page-section"><div className="section-title-row"><div><h2>Account directory</h2><p>{users.length} registered {users.length===1?"user":"users"}.</p></div></div>{error&&<p className="form-error" role="alert">{error}</p>}<div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead><tbody>{users.map(account=><tr key={account._id}><td>{account.name}</td><td>{account.email}</td><td>{account.role}</td><td>{new Date(account.createdAt).toLocaleDateString()}</td></tr>)}</tbody></table></div></section>
  </DashboardLayout>;
}

function EventForm({edit=false,admin=false}){
  const {user,events,addEvent,updateEvent}=useApp();
  const navigate=useNavigate(); const {eventId}=useParams();
  const original=events.find(e=>e.id===eventId);
  const [title,setTitle]=useState(original?.title||"");
  const [category,setCategory]=useState(original?.category||"");
  const [description,setDescription]=useState(original?.description||"");
  const [date,setDate]=useState(original?.formDate||"");
  const [startTime,setStartTime]=useState(original?.startTime||"");
  const [endTime,setEndTime]=useState(original?.endTime||"");
  const [venue,setVenue]=useState(original?.venue||"");
  const [location,setLocation]=useState(original?.location||"Main Campus, Block C");
  const [capacity,setCapacity]=useState(String(original?.capacity||100));
  const [deadline,setDeadline]=useState(original?.deadlineInput||"");
  const [googleForm,setGoogleForm]=useState(original?.googleForm||"");
  const [banner,setBanner]=useState(original?.banner||"");
  if(!user)return <RouterNavigate to={admin?"/admin-login":"/signin"} replace/>;
  if(admin&&!user.admin)return <RouterNavigate to="/admin-login" replace/>;
  if(!admin&&user.admin)return <RouterNavigate to="/admin" replace/>;
  if(edit&&(!original||(admin?!user.admin:original.ownerEmail!==user.email)))return <RouterNavigate to={admin?"/admin":"/my-events"} replace/>;
  async function submit(e){
    e.preventDefault();
    const dateObj=date?new Date(`${date}T12:00:00`):null;
    const prettyDate=dateObj&&!Number.isNaN(dateObj.getTime())?dateObj.toLocaleDateString("en-US",{weekday:"short",month:"short",day:"numeric",year:"numeric"}):date;
    const formatTime=t=>{if(!t)return "";const [h,m]=t.split(":").map(Number);const suffix=h>=12?"PM":"AM";return `${h%12||12}:${String(m).padStart(2,"0")} ${suffix}`};
    const oldRegistered=original?.registered||0;
    const item={...(original||{}),id:original?.id||`${title.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-")}-${Date.now()}`,title:title.trim(),category,description,formDate:date,date:prettyDate,fullDate:prettyDate,time:`${formatTime(startTime)}${endTime?`–${formatTime(endTime)}`:""}`,startTime,endTime,venue,location,campus:location,host:original?.host||user.name,ownerEmail:original?.ownerEmail||user.email,capacity:Number(capacity),registered:oldRegistered,seats:Math.max(0,Number(capacity)-oldRegistered),deadline:deadline?new Date(deadline).toLocaleString("en-US",{month:"short",day:"numeric",year:"numeric",hour:"numeric",minute:"2-digit"}):"Not specified",deadlineInput:deadline,googleForm,banner,status:"Upcoming",registrationOpen:Boolean(googleForm)&&Number(capacity)>oldRegistered,visual:category==="Music"?"concert":category==="Cultural"?"masks":category==="Sports"?"wellness":"calendar"};
    try{if(edit)await updateEvent(item);else await addEvent(item);navigate(admin?"/admin":"/my-events");}catch(error){window.alert(error.message||"Could not save event.");}
  }
  return <div className="app-shell"><Navbar active={admin?"admin":edit?"mine":"events"}/><main className="dashboard-main create-event-page"><Link to={admin?"/admin":"/my-events"} className="details-back">← Back to {admin?"dashboard":"My Events"}</Link><div className="create-event-intro"><h1>{edit?"Edit Event":"Create Event"}</h1><p>Fill in the details — you'll be the owner and can edit or delete it anytime.</p></div>
    <form className="event-form event-form-sections" onSubmit={submit}>
      <section className="event-form-section"><h2>Basic Information</h2><p>The essentials people see first.</p><div className="form-grid"><label className="form-full">Event Name<input value={title} onChange={e=>setTitle(e.target.value)} required placeholder="e.g. AI & Innovation Workshop"/></label><label>Category<select value={category} onChange={e=>setCategory(e.target.value)} required><option value="">Select a category</option>{categories.map(c=><option key={c} value={c}>{c}</option>)}</select></label><label className="form-full">Description<textarea rows="3" value={description} onChange={e=>setDescription(e.target.value)} required placeholder="What is this event about? Who should come?"/></label></div></section>
      <section className="event-form-section"><h2>Schedule &amp; Location</h2><p>When and where it happens.</p><div className="form-grid three-cols"><label>Date<input type="date" value={date} onChange={e=>setDate(e.target.value)} required/></label><label>Start Time<input type="time" value={startTime} onChange={e=>setStartTime(e.target.value)} required/></label><label>End Time<input type="time" value={endTime} onChange={e=>setEndTime(e.target.value)} required/></label><label>Venue<input value={venue} onChange={e=>setVenue(e.target.value)} required placeholder="Seminar Hall 2"/></label><label className="form-full">Location<input value={location} onChange={e=>setLocation(e.target.value)} required placeholder="Main Campus, Block C"/></label></div></section>
      <section className="event-form-section"><h2>Registration</h2><p>Seats and the sign-up deadline are enforced automatically.</p><div className="form-grid"><label>Maximum Capacity<input type="number" min="1" value={capacity} onChange={e=>setCapacity(e.target.value)} required/></label><label>Registration Deadline<input type="datetime-local" value={deadline} onChange={e=>setDeadline(e.target.value)} required/></label><label className="form-full">Google Form Link<input type="url" value={googleForm} onChange={e=>setGoogleForm(e.target.value)} required placeholder="https://forms.gle/..."/><small className="field-help">Attendees must open this form before the Register button unlocks.</small></label></div></section>
      <section className="event-form-section"><h2>Appearance</h2><p>Optional — leave empty for a soft pastel cover.</p><div className="form-grid"><label className="form-full">Event Banner (image URL)<input type="url" value={banner} onChange={e=>setBanner(e.target.value)} placeholder="https://..."/></label><div className="event-banner-preview form-full" style={banner?{backgroundImage:`url(${banner})`}:undefined}>{!banner&&<span>✦ Soft pastel cover — paste an image URL to replace it</span>}</div></div></section>
      <div className="form-actions"><button type="button" className="button-secondary" onClick={()=>navigate(admin?"/admin":"/my-events")}>Cancel</button><button className="button-primary">{edit?"Save Changes":"Create Event"}</button></div>
    </form></main><Footer/></div>
}
function Footer(){return <footer className="site-footer">Evently <span>✦</span> Your campus, your community.</footer>}
function App(){
  const [events,setEvents]=useState([]),[user,setUser]=useState(null),[registrations,setRegistrations]=useState([]),[registrationIds,setRegistrationIds]=useState({});
  useEffect(()=>{api("/events").then(data=>setEvents(data.map(fromApiEvent))).catch(error=>console.error(error.message));},[]);
  useEffect(()=>{if(localStorage.getItem("evently-token"))api("/auth/me").then(({user:current})=>setUser({...current,admin:current.role==="admin"})).catch(()=>localStorage.removeItem("evently-token"));},[]);
  useEffect(()=>{if(user)api("/registrations/my").then(items=>{const valid=items.filter(item=>item.event);setRegistrations(valid.map(item=>item.event._id));setRegistrationIds(Object.fromEntries(valid.map(item=>[item.event._id,item._id])));}).catch(error=>console.error(error.message));},[user]);
  function login(result){localStorage.setItem("evently-token",result.token);setUser({...result.user,admin:result.user.role==="admin"});}
  function logout(){localStorage.removeItem("evently-token");setUser(null);setRegistrations([]);setRegistrationIds({});}
  async function registerForEvent(id){if(registrations.includes(id))return;const result=await api("/registrations/"+id,{method:"POST"});setRegistrations(old=>[...old,id]);if(result.registration)setRegistrationIds(old=>({...old,[id]:result.registration._id}));setEvents(old=>old.map(e=>e.id===id?{...e,registered:e.registered+1,seats:Math.max(0,e.seats-1)}:e));}
  async function cancelRegistration(id){const registrationId=registrationIds[id];if(!registrationId)return;await api("/registrations/"+registrationId,{method:"DELETE"});setRegistrations(old=>old.filter(x=>x!==id));setRegistrationIds(old=>{const next={...old};delete next[id];return next;});setEvents(old=>old.map(e=>e.id===id?{...e,registered:Math.max(0,e.registered-1),seats:e.seats+1}:e));}
  async function addEvent(event){const result=await api("/events",{method:"POST",body:JSON.stringify(toApiEvent(event))});setEvents(old=>[fromApiEvent({...result.event,createdBy:user}),...old]);}
  async function updateEvent(event){const result=await api("/events/"+event.id,{method:"PUT",body:JSON.stringify(toApiEvent(event))});setEvents(old=>old.map(e=>e.id===event.id?fromApiEvent({...result.event,createdBy:user}):e));}
  async function deleteEvent(id){await api("/events/"+id,{method:"DELETE"});setEvents(old=>old.filter(e=>e.id!==id));setRegistrations(old=>old.filter(x=>x!==id));}
  const value={events,user,registrations,login,logout,registerForEvent,cancelRegistration,addEvent,updateEvent,deleteEvent};
  return <AppContext.Provider value={value}><BrowserRouter><Routes><Route path="/" element={<Home/>}/><Route path="/events" element={<Events/>}/><Route path="/events/:eventId" element={<EventDetails/>}/><Route path="/signin" element={<AuthPage/>}/><Route path="/admin-login" element={<AuthPage admin/>}/><Route path="/my-events" element={<MyEvents/>}/><Route path="/my-registrations" element={<MyRegistrations/>}/><Route path="/admin" element={<AdminDashboard/>}/><Route path="/admin/events" element={<AdminManageEvents/>}/><Route path="/admin/registrations" element={<AdminRegistrations/>}/><Route path="/admin/users" element={<AdminUsers/>}/><Route path="/events/new" element={<EventForm/>}/><Route path="/events/:eventId/edit" element={<EventForm edit/>}/><Route path="/admin/events/new" element={<EventForm admin/>}/><Route path="/admin/events/:eventId/edit" element={<EventForm edit admin/>}/><Route path="*" element={<div className="app-shell"><Navbar/><main className="empty-page"><h1>Page not found</h1><Link className="button-primary" to="/">Return home</Link></main><Footer/></div>}/></Routes></BrowserRouter></AppContext.Provider>;
}
export default App;
