import React, { useState } from "react";
import {
  Play,
  Pause,
  Maximize2,
  Volume2,
  VolumeX,
  Camera,
  ShieldCheck,
  UserRound,
  Car,
  Flame,
  AlertTriangle,
  Eye,
  Activity,
  Bell,
  Clock3,
  MapPin,
  ChevronRight,
  Radio,
  ScanFace,
  Siren,
  CircleCheck,
  X,
  Zap,
} from "lucide-react";

const RequestDemo = () => {
  // ============================================================
  // DEMO CAMERA DATA
  // ============================================================

  const cameras = [
    {
      id: 1,
      name: "Main Entrance",
      location: "Front Gate",
      status: "Online",
      image:
        "https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=900&q=80",
      detections: 12,
    },
    {
      id: 2,
      name: "Parking Area",
      location: "North Parking",
      status: "Online",
      image:
        "https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=900&q=80",
      detections: 8,
    },
    {
      id: 3,
      name: "Warehouse",
      location: "Storage Block",
      status: "Online",
      image:
        "https://images.unsplash.com/photo-1586528116493-da8b8ee0e3f7?auto=format&fit=crop&w=900&q=80",
      detections: 5,
    },
    {
      id: 4,
      name: "Back Entrance",
      location: "Rear Gate",
      status: "Warning",
      image:
        "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=900&q=80",
      detections: 3,
    },
  ];

  // ============================================================
  // AI DETECTION DATA
  // ============================================================

  const detectionTypes = [
    {
      id: "person",
      title: "People",
      count: 24,
      confidence: "98%",
      icon: UserRound,
      description: "Person detection",
    },
    {
      id: "vehicle",
      title: "Vehicles",
      count: 16,
      confidence: "96%",
      icon: Car,
      description: "Vehicle detection",
    },
    {
      id: "face",
      title: "Faces",
      count: 11,
      confidence: "97%",
      icon: ScanFace,
      description: "Face recognition",
    },
    {
      id: "fire",
      title: "Fire",
      count: 1,
      confidence: "99%",
      icon: Flame,
      description: "Fire detection",
    },
  ];

  // ============================================================
  // ALERT DATA
  // ============================================================

  const alerts = [
    {
      id: 1,
      type: "Intrusion",
      message: "Movement detected near rear entrance",
      time: "Just now",
      level: "high",
      icon: Siren,
    },
    {
      id: 2,
      type: "Vehicle",
      message: "Vehicle detected in parking area",
      time: "2 min ago",
      level: "medium",
      icon: Car,
    },
    {
      id: 3,
      type: "Person",
      message: "Person detected at main entrance",
      time: "5 min ago",
      level: "low",
      icon: UserRound,
    },
  ];

  // ============================================================
  // STATES
  // ============================================================

  const [selectedCamera, setSelectedCamera] = useState(cameras[0]);

  const [isPlaying, setIsPlaying] = useState(true);

  const [isMuted, setIsMuted] = useState(false);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const [activeDetection, setActiveDetection] =
    useState("person");

  const [showAlerts, setShowAlerts] = useState(true);

  // ============================================================
  // CAMERA SELECTION
  // ============================================================

  const handleCameraChange = (camera) => {
    setSelectedCamera(camera);
  };

  // ============================================================
  // PLAY / PAUSE
  // ============================================================

  const togglePlayback = () => {
    setIsPlaying((previous) => !previous);
  };

  // ============================================================
  // SOUND
  // ============================================================

  const toggleMute = () => {
    setIsMuted((previous) => !previous);
  };

  // ============================================================
  // FULLSCREEN
  // ============================================================

  const toggleFullscreen = () => {
    setIsFullscreen((previous) => !previous);
  };

  // ============================================================
  // DETECTION FILTER
  // ============================================================

  const handleDetectionChange = (type) => {
    setActiveDetection(type);
  };

  // ============================================================
  // ALERT PANEL
  // ============================================================

  const toggleAlerts = () => {
    setShowAlerts((previous) => !previous);
  };

  // ============================================================
  // STATUS COLOR
  // ============================================================

  const getStatusClass = (status) => {
    if (status === "Online") {
      return "bg-green-50 text-green-600";
    }

    return "bg-yellow-50 text-yellow-600";
  };

  // ============================================================
  // ALERT COLOR
  // ============================================================

  const getAlertClass = (level) => {
    if (level === "high") {
      return "bg-red-50 text-red-600";
    }

    if (level === "medium") {
      return "bg-yellow-50 text-yellow-600";
    }

    return "bg-blue-50 text-blue-600";
  };

  // ============================================================
  // MAIN RETURN STARTS HERE
  // ============================================================

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#071426]">

      {/* ========================================================
          DEMO PAGE CONTAINER
      ======================================================== */}

      <div className="w-full max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

              {/* ========================================================
          DEMO HEADER
      ======================================================== */}

      <section className="
        mb-6
        rounded-3xl
        overflow-hidden
        bg-[#071426]
        relative
        border
        border-white/5
      ">

        {/* Background glow */}

        <div className="
          absolute
          -top-32
          -right-20
          w-80
          h-80
          rounded-full
          bg-[#F4B400]/10
          blur-3xl
        " />

        <div className="
          absolute
          -bottom-40
          -left-20
          w-96
          h-96
          rounded-full
          bg-blue-500/10
          blur-3xl
        " />


        <div className="
          relative
          z-10
          px-6
          sm:px-8
          lg:px-10
          py-8
          sm:py-10
        ">

          <div className="
            flex
            flex-col
            lg:flex-row
            lg:items-center
            lg:justify-between
            gap-7
          ">

            {/* ==================================================
                HEADER TEXT
            ================================================== */}

            <div>

              <div className="
                inline-flex
                items-center
                gap-2
                px-3
                py-1.5
                rounded-full
                bg-[#F4B400]/10
                border
                border-[#F4B400]/20
                text-[#F4B400]
                text-[10px]
                sm:text-xs
                font-black
                uppercase
                tracking-[0.15em]
              ">

                <Radio size={13} />

                Interactive Demo

              </div>


              <h1 className="
                text-3xl
                sm:text-4xl
                lg:text-5xl
                font-black
                text-white
                tracking-tight
                mt-4
              ">

                Experience HoneyVision
                <span className="text-[#F4B400]">
                  {" "}in Action
                </span>

              </h1>


              <p className="
                max-w-2xl
                text-sm
                sm:text-base
                text-white/55
                leading-7
                mt-4
              ">
                Explore our intelligent surveillance platform,
                monitor live camera feeds and see how
                AI-powered detection helps protect your
                people, property and business.
              </p>

            </div>


            {/* ==================================================
                LIVE STATUS
            ================================================== */}

            <div className="
              shrink-0
              rounded-2xl
              border
              border-white/10
              bg-white/5
              px-5
              py-4
              backdrop-blur-sm
            ">

              <div className="
                flex
                items-center
                gap-3
              ">

                <span className="
                  relative
                  flex
                  h-3
                  w-3
                ">

                  <span className="
                    absolute
                    inline-flex
                    h-full
                    w-full
                    animate-ping
                    rounded-full
                    bg-green-400
                    opacity-60
                  />

                  <span className="
                    relative
                    inline-flex
                    h-3
                    w-3
                    rounded-full
                    bg-green-500
                  />

                </span>


                <div>

                  <p className="
                    text-xs
                    font-black
                    text-white
                  ">
                    SYSTEM ONLINE
                  </p>

                  <p className="
                    text-[10px]
                    text-white/40
                    mt-0.5
                  ">
                    AI monitoring active
                  </p>

                </div>

              </div>

            </div>

          </div>

        </div>

      </section>



      {/* ========================================================
          DEMO WORKSPACE
      ======================================================== */}

      <section className="
        grid
        grid-cols-1
        xl:grid-cols-[250px_minmax(0,1fr)]
        gap-5
        items-start
      ">


        {/* ======================================================
            CAMERA LIST SIDEBAR
        ====================================================== */}

        <aside className="
          bg-white
          rounded-2xl
          border
          border-gray-100
          shadow-sm
          overflow-hidden
        ">


          {/* SIDEBAR HEADER */}

          <div className="
            px-5
            py-4
            border-b
            border-gray-100
          ">

            <div className="
              flex
              items-center
              justify-between
              gap-3
            ">

              <div>

                <p className="
                  text-[10px]
                  uppercase
                  tracking-[0.15em]
                  font-black
                  text-[#C58A00]
                ">
                  Camera System
                </p>

                <h2 className="
                  text-base
                  font-black
                  text-[#071426]
                  mt-1
                ">
                  Live Cameras
                </h2>

              </div>


              <div className="
                w-9
                h-9
                rounded-xl
                bg-[#071426]
                flex
                items-center
                justify-center
              ">

                <Camera
                  size={17}
                  className="text-[#F4B400]"
                />

              </div>

            </div>

          </div>



          {/* CAMERA ITEMS */}

          <div className="
            p-3
            space-y-2
          ">

            {cameras.map((camera) => (

              <button
                key={camera.id}
                type="button"
                onClick={() =>
                  handleCameraChange(camera)
                }
                className={`
                  w-full
                  text-left
                  rounded-xl
                  p-3
                  border
                  transition-all
                  ${
                    selectedCamera.id === camera.id
                      ? "border-[#F4B400] bg-[#FFF9E8]"
                      : "border-transparent hover:border-gray-200 hover:bg-gray-50"
                  }
                `}
              >

                <div className="
                  flex
                  items-center
                  gap-3
                ">


                  {/* CAMERA THUMBNAIL */}

                  <div className="
                    relative
                    w-14
                    h-14
                    rounded-lg
                    overflow-hidden
                    bg-gray-100
                    shrink-0
                  ">

                    <img
                      src={camera.image}
                      alt={camera.name}
                      className="
                        w-full
                        h-full
                        object-cover
                      "
                    />


                    <span className="
                      absolute
                      left-1.5
                      top-1.5
                      w-2
                      h-2
                      rounded-full
                      bg-green-500
                      border
                      border-white
                    " />

                  </div>


                  {/* CAMERA DETAILS */}

                  <div className="min-w-0 flex-1">

                    <p className="
                      text-xs
                      font-black
                      text-[#071426]
                      truncate
                    ">
                      {camera.name}
                    </p>


                    <div className="
                      flex
                      items-center
                      gap-1
                      mt-1
                    ">

                      <MapPin
                        size={10}
                        className="text-gray-400"
                      />

                      <span className="
                        text-[10px]
                        text-gray-400
                        truncate
                      ">
                        {camera.location}
                      </span>

                    </div>


                    <div className="
                      flex
                      items-center
                      justify-between
                      gap-2
                      mt-2
                    ">

                      <span className={`
                        px-1.5
                        py-0.5
                        rounded
                        text-[8px]
                        font-black
                        uppercase
                        ${getStatusClass(camera.status)}
                      `}>
                        {camera.status}
                      </span>


                      <span className="
                        text-[9px]
                        text-gray-400
                      ">
                        {camera.detections} detections
                      </span>

                    </div>

                  </div>

                </div>

              </button>

            ))}

          </div>


          {/* SIDEBAR FOOTER */}

          <div className="
            border-t
            border-gray-100
            px-4
            py-4
          ">

            <div className="
              flex
              items-center
              justify-between
            ">

              <span className="
                text-[10px]
                font-bold
                text-gray-400
              ">
                Cameras Online
              </span>

              <span className="
                text-xs
                font-black
                text-green-600
              ">
                3 / 4
              </span>

            </div>


            <div className="
              mt-2
              h-1.5
              rounded-full
              bg-gray-100
              overflow-hidden
            ">

              <div className="
                h-full
                w-[75%]
                rounded-full
                bg-green-500
              " />

            </div>

          </div>

        </aside>



        {/* ======================================================
            RIGHT DEMO AREA
        ====================================================== */}

        <div className="min-w-0">


          {/* ====================================================
              LIVE CAMERA PREVIEW
          ==================================================== */}

          <div className="
            rounded-2xl
            overflow-hidden
            bg-[#071426]
            shadow-sm
            border
            border-gray-200
          ">


            {/* PREVIEW HEADER */}

            <div className="
              px-4
              sm:px-5
              py-3
              border-b
              border-white/10
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-3
            ">


              <div className="
                flex
                items-center
                gap-3
              ">

                <div className="
                  w-9
                  h-9
                  rounded-lg
                  bg-white/10
                  flex
                  items-center
                  justify-center
                ">

                  <Camera
                    size={16}
                    className="text-[#F4B400]"
                  />

                </div>


                <div>

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <h2 className="
                      text-sm
                      font-black
                      text-white
                    ">
                      {selectedCamera.name}
                    </h2>


                    <span className="
                      w-1.5
                      h-1.5
                      rounded-full
                      bg-green-500
                    " />

                    <span className="
                      text-[9px]
                      font-bold
                      text-green-400
                      uppercase
                    ">
                      Live
                    </span>

                  </div>


                  <p className="
                    text-[10px]
                    text-white/35
                    mt-0.5
                  ">
                    {selectedCamera.location}
                  </p>

                </div>

              </div>


              {/* PREVIEW CONTROLS */}

              <div className="
                flex
                items-center
                gap-1.5
              ">

                <button
                  type="button"
                  onClick={togglePlayback}
                  className="
                    w-9
                    h-9
                    rounded-lg
                    bg-white/5
                    border
                    border-white/10
                    text-white
                    flex
                    items-center
                    justify-center
                    hover:bg-white/10
                    transition
                  "
                  aria-label={
                    isPlaying ? "Pause" : "Play"
                  }
                >

                  {isPlaying ? (
                    <Pause size={15} />
                  ) : (
                    <Play size={15} />
                  )}

                </button>


                <button
                  type="button"
                  onClick={toggleMute}
                  className="
                    w-9
                    h-9
                    rounded-lg
                    bg-white/5
                    border
                    border-white/10
                    text-white
                    flex
                    items-center
                    justify-center
                    hover:bg-white/10
                    transition
                  "
                  aria-label={
                    isMuted ? "Unmute" : "Mute"
                  }
                >

                  {isMuted ? (
                    <VolumeX size={15} />
                  ) : (
                    <Volume2 size={15} />
                  )}

                </button>


                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="
                    w-9
                    h-9
                    rounded-lg
                    bg-white/5
                    border
                    border-white/10
                    text-white
                    flex
                    items-center
                    justify-center
                    hover:bg-white/10
                    transition
                  "
                  aria-label="Fullscreen"
                >

                  <Maximize2 size={15} />

                </button>

              </div>

            </div>



            {/* ==================================================
                VIDEO AREA
            ================================================== */}

            <div className="
              relative
              aspect-video
              bg-black
              overflow-hidden
            ">

              <img
                src={selectedCamera.image}
                alt={selectedCamera.name}
                className="
                  absolute
                  inset-0
                  w-full
                  h-full
                  object-cover
                "
              />


              {/* DARK OVERLAY */}

              <div className="
                absolute
                inset-0
                bg-gradient-to-t
                from-black/60
                via-transparent
                to-black/20
              " />


              {/* AI SCAN LINE */}

              {isPlaying && (
                <div
                  className="
                    absolute
                    left-0
                    right-0
                    top-[35%]
                    h-px
                    bg-[#F4B400]/80
                    shadow-[0_0_15px_rgba(244,180,0,0.8)]
                    animate-pulse
                  "
                />
              )}


              {/* TOP LEFT LIVE BADGE */}

              <div
                className="
                  absolute
                  left-4
                  top-4
                  flex
                  items-center
                  gap-2
                  px-2.5
                  py-1.5
                  rounded-lg
                  bg-black/60
                  backdrop-blur-sm
                  border
                  border-white/10
                "
              >
                <span
                  className="
                    w-2
                    h-2
                    rounded-full
                    bg-red-500
                    animate-pulse
                  "
                />

                <span
                  className="
                    text-[9px]
                    font-black
                    text-white
                    uppercase
                    tracking-wider
                  "
                >
                  LIVE
                </span>
              </div>


              {/* TOP RIGHT AI BADGE */}

              <div
                className="
                  absolute
                  right-4
                  top-4
                  flex
                  items-center
                  gap-2
                  px-2.5
                  py-1.5
                  rounded-lg
                  bg-black/60
                  backdrop-blur-sm
                  border
                  border-white/10
                "
              >
                <Eye size={12} className="text-[#F4B400]" />

                <span
                  className="
                    text-[9px]
                    font-bold
                    text-white
                  "
                >
                  AI VISION ACTIVE
                </span>
              </div>


              {/* DETECTION BOX */}

              {activeDetection === "person" && (

                <div className="
                  absolute
                  left-[42%]
                  top-[29%]
                  w-[13%]
                  h-[42%]
                  min-w-[55px]
                  border-2
                  border-[#F4B400]
                  rounded-md
                ">

                  <span className="
                    absolute
                    -top-6
                    left-0
                    px-2
                    py-1
                    rounded
                    bg-[#F4B400]
                    text-[#071426]
                    text-[8px]
                    font-black
                  ">
                    PERSON 98%
                  </span>

                </div>

              )}


              {activeDetection === "vehicle" && (

                <div className="
                  absolute
                  left-[55%]
                  bottom-[25%]
                  w-[22%]
                  h-[16%]
                  min-w-[100px]
                  border-2
                  border-blue-400
                  rounded-md
                ">

                  <span className="
                    absolute
                    -top-6
                    left-0
                    px-2
                    py-1
                    rounded
                    bg-blue-500
                    text-white
                    text-[8px]
                    font-black
                  ">
                    VEHICLE 96%
                  </span>

                </div>

              )}


              {/* BOTTOM CAMERA INFORMATION */}

              <div className="
                absolute
                left-4
                right-4
                bottom-4
                flex
                flex-col
                sm:flex-row
                sm:items-end
                sm:justify-between
                gap-3
              ">

                <div>

                  <p className="
                    text-[9px]
                    text-white/50
                    uppercase
                    tracking-wider
                  ">
                    Camera ID
                  </p>

                  <p className="
                    text-xs
                    font-bold
                    text-white
                    mt-0.5
                  ">
                    HV-CAM-{selectedCamera.id
                      .toString()
                      .padStart(3, "0")}
                  </p>

                </div>


                <div className="
                  flex
                  items-center
                  gap-2
                  px-3
                  py-2
                  rounded-lg
                  bg-black/60
                  backdrop-blur-sm
                  border
                  border-white/10
                ">

                  <Clock3
                    size={12}
                    className="text-[#F4B400]"
                  />

                  <span className="
                    text-[10px]
                    font-bold
                    text-white
                  ">
                    10:42:18 AM
                  </span>

                </div>

              </div>

            </div>



            {/* PREVIEW FOOTER */}

            <div className="
              px-4
              sm:px-5
              py-3
              border-t
              border-white/10
              flex
              items-center
              justify-between
              gap-3
            ">

              <div className="
                flex
                items-center
                gap-2
              ">

                <Activity
                  size={14}
                  className="text-green-400"
                />

                <span className="
                  text-[10px]
                  text-white/50
                ">
                  AI processing active
                </span>

              </div>


              <span className="
                text-[10px]
                font-bold
                text-white/40
              ">
                1080p • 25 FPS
              </span>

            </div>

          </div>

                    {/* ======================================================
              AI DETECTION CONTROLS
          ====================================================== */}

          <section className="
            mt-5
            bg-white
            rounded-2xl
            border
            border-gray-100
            shadow-sm
            overflow-hidden
          ">

            {/* ==================================================
                SECTION HEADER
            ================================================== */}

            <div className="
              px-5
              sm:px-6
              py-4
              border-b
              border-gray-100
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-3
            ">

              <div>

                <p className="
                  text-[10px]
                  uppercase
                  tracking-[0.15em]
                  font-black
                  text-[#C58A00]
                ">
                  Artificial Intelligence
                </p>

                <h2 className="
                  text-lg
                  sm:text-xl
                  font-black
                  text-[#071426]
                  mt-1
                ">
                  AI Detection
                </h2>

              </div>


              <div className="
                flex
                items-center
                gap-2
                px-3
                py-1.5
                rounded-lg
                bg-green-50
                text-green-600
              ">

                <CircleCheck size={14} />

                <span className="
                  text-[10px]
                  font-black
                  uppercase
                ">
                  AI Active
                </span>

              </div>

            </div>



            {/* ==================================================
                DETECTION FILTERS
            ================================================== */}

            <div className="
              p-4
              sm:p-5
            ">

              <div className="
                grid
                grid-cols-2
                sm:grid-cols-4
                gap-3
              ">

                {detectionTypes.map((detection) => {

                  const Icon = detection.icon;

                  const isActive =
                    activeDetection === detection.id;

                  return (

                    <button
                      key={detection.id}
                      type="button"
                      onClick={() =>
                        handleDetectionChange(
                          detection.id
                        )
                      }
                      className={`
                        relative
                        text-left
                        rounded-xl
                        border
                        p-4
                        transition-all
                        ${
                          isActive
                            ? "border-[#F4B400] bg-[#FFF9E8] shadow-sm"
                            : "border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50"
                        }
                      `}
                    >

                      {/* ACTIVE INDICATOR */}

                      {isActive && (

                        <span className="
                          absolute
                          right-3
                          top-3
                          w-2
                          h-2
                          rounded-full
                          bg-[#F4B400]
                        " />

                      )}


                      {/* ICON */}

                      <div className={`
                        w-10
                        h-10
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        ${
                          isActive
                            ? "bg-[#071426] text-[#F4B400]"
                            : "bg-gray-100 text-gray-500"
                        }
                      `}>

                        <Icon size={18} />

                      </div>


                      {/* TITLE */}

                      <p className="
                        text-sm
                        font-black
                        text-[#071426]
                        mt-3
                      ">
                        {detection.title}
                      </p>


                      {/* DESCRIPTION */}

                      <p className="
                        text-[10px]
                        text-gray-400
                        mt-1
                      ">
                        {detection.description}
                      </p>


                      {/* COUNT + CONFIDENCE */}

                      <div className="
                        flex
                        items-end
                        justify-between
                        gap-2
                        mt-4
                      ">

                        <div>

                          <p className="
                            text-xl
                            font-black
                            text-[#071426]
                          ">
                            {detection.count}
                          </p>

                          <p className="
                            text-[9px]
                            text-gray-400
                          ">
                            Detected
                          </p>

                        </div>


                        <span className="
                          px-2
                          py-1
                          rounded-md
                          bg-green-50
                          text-green-600
                          text-[9px]
                          font-black
                        ">
                          {detection.confidence}
                        </span>

                      </div>

                    </button>

                  );

                })}

              </div>

            </div>

          </section>



          {/* ======================================================
              STATISTICS + ALERTS
          ====================================================== */}

          <section className="
            mt-5
            grid
            grid-cols-1
            lg:grid-cols-[1fr_1fr]
            gap-5
          ">


            {/* ====================================================
                MONITORING STATISTICS
            ==================================================== */}

            <div className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              overflow-hidden
            ">

              {/* HEADER */}

              <div className="
                px-5
                py-4
                border-b
                border-gray-100
                flex
                items-center
                justify-between
                gap-3
              ">

                <div>

                  <p className="
                    text-[10px]
                    uppercase
                    tracking-[0.15em]
                    font-black
                    text-[#C58A00]
                  ">
                    System Overview
                  </p>

                  <h2 className="
                    text-base
                    sm:text-lg
                    font-black
                    text-[#071426]
                    mt-1
                  ">
                    Monitoring Statistics
                  </h2>

                </div>


                <Activity
                  size={19}
                  className="text-[#F4B400]"
                />

              </div>



              {/* STATISTICS GRID */}

              <div className="
                grid
                grid-cols-2
                gap-px
                bg-gray-100
              ">


                {/* TOTAL DETECTIONS */}

                <div className="
                  bg-white
                  p-5
                ">

                  <div className="
                    w-9
                    h-9
                    rounded-lg
                    bg-blue-50
                    flex
                    items-center
                    justify-center
                  ">

                    <Eye
                      size={17}
                      className="text-blue-600"
                    />

                  </div>


                  <p className="
                    text-2xl
                    font-black
                    text-[#071426]
                    mt-4
                  ">
                    59
                  </p>


                  <p className="
                    text-xs
                    text-gray-400
                    mt-1
                  ">
                    Total Detections
                  </p>


                  <div className="
                    flex
                    items-center
                    gap-1
                    mt-3
                    text-[10px]
                    font-bold
                    text-green-600
                  ">

                    <Activity size={11} />

                    +18.4% today

                  </div>

                </div>



                {/* ACTIVE CAMERAS */}

                <div className="
                  bg-white
                  p-5
                ">

                  <div className="
                    w-9
                    h-9
                    rounded-lg
                    bg-green-50
                    flex
                    items-center
                    justify-center
                  ">

                    <Camera
                      size={17}
                      className="text-green-600"
                    />

                  </div>


                  <p className="
                    text-2xl
                    font-black
                    text-[#071426]
                    mt-4
                  ">
                    3
                  </p>


                  <p className="
                    text-xs
                    text-gray-400
                    mt-1
                  ">
                    Active Cameras
                  </p>


                  <div className="
                    flex
                    items-center
                    gap-1
                    mt-3
                    text-[10px]
                    font-bold
                    text-green-600
                  ">

                    <CircleCheck size={11} />

                    All systems normal

                  </div>

                </div>



                {/* PROCESSING SPEED */}

                <div className="
                  bg-white
                  p-5
                ">

                  <div className="
                    w-9
                    h-9
                    rounded-lg
                    bg-purple-50
                    flex
                    items-center
                    justify-center
                  ">

                    <Activity
                      size={17}
                      className="text-purple-600"
                    />

                  </div>


                  <p className="
                    text-2xl
                    font-black
                    text-[#071426]
                    mt-4
                  ">
                    25
                  </p>


                  <p className="
                    text-xs
                    text-gray-400
                    mt-1
                  ">
                    FPS Processing
                  </p>


                  <div className="
                    flex
                    items-center
                    gap-1
                    mt-3
                    text-[10px]
                    font-bold
                    text-purple-600
                  ">

                    <Zap
                      size={11}
                    />

                    Real-time AI

                  </div>

                </div>



                {/* UPTIME */}

                <div className="
                  bg-white
                  p-5
                ">

                  <div className="
                    w-9
                    h-9
                    rounded-lg
                    bg-[#FFF7DB]
                    flex
                    items-center
                    justify-center
                  ">

                    <ShieldCheck
                      size={17}
                      className="text-[#C58A00]"
                    />

                  </div>


                  <p className="
                    text-2xl
                    font-black
                    text-[#071426]
                    mt-4
                  ">
                    99.9%
                  </p>


                  <p className="
                    text-xs
                    text-gray-400
                    mt-1
                  ">
                    System Uptime
                  </p>


                  <div className="
                    flex
                    items-center
                    gap-1
                    mt-3
                    text-[10px]
                    font-bold
                    text-green-600
                  ">

                    <CircleCheck size={11} />

                    Excellent

                  </div>

                </div>

              </div>

            </div>



            {/* ====================================================
                ALERT CENTER
            ==================================================== */}

            <div className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              shadow-sm
              overflow-hidden
            ">


              {/* ALERT HEADER */}

              <div className="
                px-5
                py-4
                border-b
                border-gray-100
                flex
                items-center
                justify-between
                gap-3
              ">

                <div>

                  <div className="
                    flex
                    items-center
                    gap-2
                  ">

                    <p className="
                      text-[10px]
                      uppercase
                      tracking-[0.15em]
                      font-black
                      text-[#C58A00]
                    ">
                      Security Center
                    </p>


                    <span className="
                      px-1.5
                      py-0.5
                      rounded
                      bg-red-50
                      text-red-600
                      text-[8px]
                      font-black
                    ">
                      3 NEW
                    </span>

                  </div>


                  <h2 className="
                    text-base
                    sm:text-lg
                    font-black
                    text-[#071426]
                    mt-1
                  ">
                    Recent Alerts
                  </h2>

                </div>


                <button
                  type="button"
                  onClick={toggleAlerts}
                  className="
                    w-9
                    h-9
                    rounded-lg
                    bg-gray-50
                    border
                    border-gray-100
                    flex
                    items-center
                    justify-center
                    text-gray-500
                    hover:bg-gray-100
                    transition
                  "
                  aria-label="Toggle alerts"
                >

                  {showAlerts ? (
                    <Bell size={16} />
                  ) : (
                    <X size={16} />
                  )}

                </button>

              </div>



              {/* ALERT LIST */}

              {showAlerts ? (

                <div className="
                  divide-y
                  divide-gray-100
                ">

                  {alerts.map((alert) => {

                    const AlertIcon =
                      alert.icon;

                    return (

                      <div
                        key={alert.id}
                        className="
                          px-5
                          py-4
                          hover:bg-gray-50
                          transition
                        "
                      >

                        <div className="
                          flex
                          items-start
                          gap-3
                        ">


                          {/* ALERT ICON */}

                          <div className={`
                            w-9
                            h-9
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            shrink-0
                            ${getAlertClass(alert.level)}
                          `}>

                            <AlertIcon size={16} />

                          </div>


                          {/* ALERT DETAILS */}

                          <div className="min-w-0 flex-1">

                            <div className="
                              flex
                              items-start
                              justify-between
                              gap-3
                            ">

                              <p className="
                                text-xs
                                font-black
                                text-[#071426]
                              ">
                                {alert.type}
                              </p>


                              <span className="
                                text-[9px]
                                text-gray-400
                                shrink-0
                              ">
                                {alert.time}
                              </span>

                            </div>


                            <p className="
                              text-[11px]
                              text-gray-500
                              leading-5
                              mt-1
                            ">
                              {alert.message}
                            </p>


                            <div className="
                              flex
                              items-center
                              gap-1.5
                              mt-2
                            ">

                              <span className="
                                w-1.5
                                h-1.5
                                rounded-full
                                bg-red-500
                              " />

                              <span className="
                                text-[9px]
                                font-bold
                                text-gray-400
                                uppercase
                              ">
                                {alert.level} priority
                              </span>

                            </div>

                          </div>

                        </div>

                      </div>

                    );

                  })}

                </div>

              ) : (

                <div className="
                  min-h-[250px]
                  flex
                  flex-col
                  items-center
                  justify-center
                  text-center
                  px-5
                ">

                  <div className="
                    w-12
                    h-12
                    rounded-full
                    bg-gray-100
                    flex
                    items-center
                    justify-center
                  ">

                    <Bell
                      size={20}
                      className="text-gray-400"
                    />

                  </div>


                  <p className="
                    text-sm
                    font-bold
                    text-[#071426]
                    mt-3
                  ">
                    Alerts Hidden
                  </p>


                  <p className="
                    text-xs
                    text-gray-400
                    mt-1
                  ">
                    Click the notification button
                    to show alerts.
                  </p>

                </div>

              )}

            </div>

          </section>



          {/* ======================================================
              AI PROCESSING STATUS
          ====================================================== */}

          <section className="
            mt-5
            rounded-2xl
            bg-[#071426]
            border
            border-white/5
            p-5
            sm:p-6
            overflow-hidden
            relative
          ">

            <div className="
              absolute
              right-0
              top-0
              w-52
              h-52
              rounded-full
              bg-[#F4B400]/5
              blur-3xl
            " />


            <div className="
              relative
              z-10
              flex
              flex-col
              md:flex-row
              md:items-center
              md:justify-between
              gap-5
            ">


              {/* STATUS TEXT */}

              <div>

                <div className="
                  flex
                  items-center
                  gap-2
                ">

                  <span className="
                    w-2
                    h-2
                    rounded-full
                    bg-green-500
                    animate-pulse
                  " />

                  <span className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-[0.15em]
                    text-green-400
                  ">
                    AI Engine Running
                  </span>

                </div>


                <h3 className="
                  text-lg
                  sm:text-xl
                  font-black
                  text-white
                  mt-2
                ">
                  Intelligent surveillance
                  <span className="text-[#F4B400]">
                    {" "}working in real time
                  </span>
                </h3>


                <p className="
                  text-xs
                  text-white/40
                  leading-5
                  mt-2
                  max-w-2xl
                ">
                  HoneyVision AI continuously analyzes
                  camera feeds to identify people, vehicles,
                  faces, fire and security events.
                </p>

              </div>


              {/* PROCESSING INDICATORS */}

              <div className="
                flex
                flex-wrap
                gap-2
              ">

                <div className="
                  px-3
                  py-2
                  rounded-lg
                  bg-white/5
                  border
                  border-white/10
                ">

                  <p className="
                    text-[9px]
                    text-white/35
                    uppercase
                  ">
                    Accuracy
                  </p>

                  <p className="
                    text-sm
                    font-black
                    text-white
                    mt-0.5
                  ">
                    98.2%
                  </p>

                </div>


                <div className="
                  px-3
                  py-2
                  rounded-lg
                  bg-white/5
                  border
                  border-white/10
                ">

                  <p className="
                    text-[9px]
                    text-white/35
                    uppercase
                  ">
                    Latency
                  </p>

                  <p className="
                    text-sm
                    font-black
                    text-white
                    mt-0.5
                  ">
                    42ms
                  </p>

                </div>


                <div className="
                  px-3
                  py-2
                  rounded-lg
                  bg-white/5
                  border
                  border-white/10
                ">

                  <p className="
                    text-[9px]
                    text-white/35
                    uppercase
                  ">
                    Cameras
                  </p>

                  <p className="
                    text-sm
                    font-black
                    text-white
                    mt-0.5
                  ">
                    4
                  </p>

                </div>

              </div>

            </div>

          </section>

                    {/* ======================================================
              DEMO FEATURES
          ====================================================== */}

          <section className="
            mt-5
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-4
            gap-4
          ">

            {/* ====================================================
                FEATURE 1
            ==================================================== */}

            <div className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
              shadow-sm
              hover:-translate-y-1
              hover:shadow-md
              transition-all
            ">

              <div className="
                w-11
                h-11
                rounded-xl
                bg-[#FFF8DF]
                flex
                items-center
                justify-center
              ">

                <Eye
                  size={20}
                  className="text-[#C58A00]"
                />

              </div>


              <h3 className="
                text-sm
                font-black
                text-[#071426]
                mt-4
              ">
                Intelligent Monitoring
              </h3>


              <p className="
                text-xs
                text-gray-400
                leading-5
                mt-2
              ">
                Monitor multiple camera feeds and
                identify important events in real time.
              </p>

            </div>



            {/* ====================================================
                FEATURE 2
            ==================================================== */}

            <div className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
              shadow-sm
              hover:-translate-y-1
              hover:shadow-md
              transition-all
            ">

              <div className="
                w-11
                h-11
                rounded-xl
                bg-blue-50
                flex
                items-center
                justify-center
              ">

                <ScanFace
                  size={20}
                  className="text-blue-600"
                />

              </div>


              <h3 className="
                text-sm
                font-black
                text-[#071426]
                mt-4
              ">
                AI Recognition
              </h3>


              <p className="
                text-xs
                text-gray-400
                leading-5
                mt-2
              ">
                Detect faces, people and vehicles with
                intelligent AI-powered recognition.
              </p>

            </div>



            {/* ====================================================
                FEATURE 3
            ==================================================== */}

            <div className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
              shadow-sm
              hover:-translate-y-1
              hover:shadow-md
              transition-all
            ">

              <div className="
                w-11
                h-11
                rounded-xl
                bg-red-50
                flex
                items-center
                justify-center
              ">

                <Siren
                  size={20}
                  className="text-red-600"
                />

              </div>


              <h3 className="
                text-sm
                font-black
                text-[#071426]
                mt-4
              ">
                Instant Alerts
              </h3>


              <p className="
                text-xs
                text-gray-400
                leading-5
                mt-2
              ">
                Receive intelligent alerts when unusual
                activity or security events are detected.
              </p>

            </div>



            {/* ====================================================
                FEATURE 4
            ==================================================== */}

            <div className="
              bg-white
              rounded-2xl
              border
              border-gray-100
              p-5
              shadow-sm
              hover:-translate-y-1
              hover:shadow-md
              transition-all
            ">

              <div className="
                w-11
                h-11
                rounded-xl
                bg-green-50
                flex
                items-center
                justify-center
              ">

                <ShieldCheck
                  size={20}
                  className="text-green-600"
                />

              </div>


              <h3 className="
                text-sm
                font-black
                text-[#071426]
                mt-4
              ">
                Secure Protection
              </h3>


              <p className="
                text-xs
                text-gray-400
                leading-5
                mt-2
              ">
                Build a smarter security environment with
                continuous AI-powered surveillance.
              </p>

            </div>

          </section>



          {/* ======================================================
              CALL TO ACTION
          ====================================================== */}

          <section className="
            mt-6
            relative
            overflow-hidden
            rounded-3xl
            bg-[#071426]
            px-6
            sm:px-8
            lg:px-10
            py-8
            sm:py-10
            border
            border-white/5
          ">

            {/* BACKGROUND GLOW */}

            <div className="
              absolute
              -right-20
              -top-20
              w-64
              h-64
              rounded-full
              bg-[#F4B400]/10
              blur-3xl
            " />


            <div className="
              absolute
              -left-24
              -bottom-24
              w-72
              h-72
              rounded-full
              bg-blue-500/10
              blur-3xl
            " />


            {/* CTA CONTENT */}

            <div className="
              relative
              z-10
              flex
              flex-col
              lg:flex-row
              lg:items-center
              lg:justify-between
              gap-7
            ">


              {/* CTA TEXT */}

              <div>

                <div className="
                  inline-flex
                  items-center
                  gap-2
                  text-[#F4B400]
                  text-[10px]
                  font-black
                  uppercase
                  tracking-[0.15em]
                ">

                  <CircleCheck size={13} />

                  Smart Security Starts Here

                </div>


                <h2 className="
                  text-2xl
                  sm:text-3xl
                  font-black
                  text-white
                  mt-3
                ">

                  See HoneyVision
                  <span className="text-[#F4B400]">
                    {" "}in Your Environment
                  </span>

                </h2>


                <p className="
                  max-w-2xl
                  text-sm
                  text-white/45
                  leading-6
                  mt-3
                ">
                  Explore how HoneyVision AI-powered
                  surveillance solutions can help protect
                  your home, business or organization.
                </p>

              </div>



              {/* CTA BUTTONS */}

              <div className="
                flex
                flex-col
                sm:flex-row
                gap-3
                shrink-0
              ">

                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      "/contact";
                  }}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-5
                    py-3
                    rounded-xl
                    bg-[#F4B400]
                    text-[#071426]
                    text-xs
                    font-black
                    hover:bg-[#FFD15C]
                    transition
                    shadow-lg
                    shadow-[#F4B400]/10
                  "
                >

                  Request a Demo

                  <ChevronRight size={15} />

                </button>


                <button
                  type="button"
                  onClick={() => {
                    window.location.href =
                      "/contact";
                  }}
                  className="
                    inline-flex
                    items-center
                    justify-center
                    gap-2
                    px-5
                    py-3
                    rounded-xl
                    bg-white/5
                    border
                    border-white/10
                    text-white
                    text-xs
                    font-black
                    hover:bg-white/10
                    transition
                  "
                >

                  Contact Us

                  <ChevronRight size={15} />

                </button>

              </div>

            </div>

          </section>



          {/* ======================================================
              DEMO DISCLAIMER / FOOTNOTE
          ====================================================== */}

          <div className="
            mt-5
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-2
            px-2
            pb-2
          ">

            <div className="
              flex
              items-center
              gap-2
            ">

              <AlertTriangle
                size={12}
                className="text-gray-400"
              />

              <p className="
                text-[9px]
                text-gray-400
              ">
                This is an interactive demonstration.
                Camera feeds shown are sample data.
              </p>

            </div>


            <p className="
              text-[9px]
              text-gray-400
            ">
              HoneyVision AI Demo • Secure • Intelligent • Reliable
            </p>

          </div>



        </div>
        {/* END RIGHT DEMO AREA */}


      </section>
      {/* END DEMO WORKSPACE */}


    </div>
    {/* END MAX WIDTH CONTAINER */}
    </div>

    );

  };

  export default RequestDemo;